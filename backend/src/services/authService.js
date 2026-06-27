const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Wallet, sequelize } = require('../models');
const { JWT_SECRET } = require('../middlewares/auth');
const { addWalletCreationJob } = require('../jobs/queue');
const {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendForgotPasswordEmail,
  sendPasswordResetSuccessEmail,
  sendProfileUpdatedEmail
} = require('../utils/mailer');
const notificationService = require('./notificationService');

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'vendly_super_refresh_secret_key_12345';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function registerUser({ fullName, email, password, username }) {
  if (!fullName || !email || !password || !username) {
    throw new Error('fullName, email, password, and username are required');
  }

  const trimmedUsername = username.trim().toLowerCase();
  const trimmedEmail = email.trim();
  const trimmedFullName = fullName.trim();

  if (!/^[a-z0-9_]{4,15}$/.test(trimmedUsername)) {
    throw new Error('Username must be 4–15 characters: lowercase letters, numbers, and underscores only');
  }


  const [emailExists, usernameExists] = await Promise.all([
    User.findOne({ where: { email: trimmedEmail } }),
    User.findOne({ where: { username: trimmedUsername } })
  ]);

  if (emailExists) throw new Error('Email already registered');
  if (usernameExists) throw new Error('Username already taken');

  const passwordHash = await bcrypt.hash(password, 10);

  const token = jwt.sign(
    { fullName: trimmedFullName, email: trimmedEmail, passwordHash, username: trimmedUsername },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
  await sendVerificationEmail(trimmedEmail, trimmedFullName, verificationUrl);

  return { email: trimmedEmail, verificationUrl };
}

async function verifyUserEmail(token) {
  if (!token) throw new Error('Verification token is required');

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    throw new Error('Invalid or expired verification token');
  }

  const { fullName, email, passwordHash, username } = decoded;

  const [emailExists, usernameExists] = await Promise.all([
    User.findOne({ where: { email } }),
    User.findOne({ where: { username } })
  ]);

  if (emailExists) throw new Error('Account already verified and created');
  if (usernameExists) {
    throw new Error('Username is no longer available. Please register again with a different username.');
  }

  const transaction = await sequelize.transaction();
  let user;

  try {
    user = await User.create({
      fullName,
      username,
      email,
      passwordHash,
      role: 'buyer',
      status: 'active',
      emailVerified: true,
      isVerified: true
    }, { transaction });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  // Background wallet creation with username
  try {
    await addWalletCreationJob(user.id, user.username);
  } catch (err) {
    console.error(`[Queue Error] Wallet creation for user ${user.id}:`, err.message);
  }

  // Welcome email
  try {
    await sendWelcomeEmail(email, fullName, username);
  } catch (err) {
    console.error('[Email Error] Welcome email failed:', err.message);
  }

  // In-app notification
  try {
    await notificationService.notifyUser(
      user.id,
      'Welcome to Vendly!',
      'Your account is verified. Your secure Web3 wallet is being created in the background.',
      'info'
    );
  } catch (err) {
    console.error('[Notification Error]', err.message);
  }

  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role
    },
    accessToken,
    refreshToken
  };
}

async function loginUser({ identifier, password }) {
  if (!identifier || !password) throw new Error('Credentials are required');

  // Support login via email, username, or phone number
  const user = await User.findOne({
    where: {
      [Op.or]: [
        { email: identifier },
        { username: identifier },
        { phone: identifier }
      ]
    }
  });

  if (!user) throw new Error('Invalid credentials');

  if (user.status === 'suspended' || user.status === 'banned') {
    throw new Error('Account has been suspended or banned. Please contact support.');
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw new Error('Invalid credentials');

  await user.update({ lastLoginAt: new Date(), isOnline: true });

  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  try {
    await notificationService.notifyUser(
      user.id,
      'New Login Detected',
      'You have successfully logged into your Vendly account.',
      'info'
    );
  } catch (err) {
    console.error('[Notification Error]', err.message);
  }

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role
    },
    accessToken,
    refreshToken
  };
}

async function refreshAccessToken(refreshToken) {
  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findByPk(payload.id);
    if (!user || user.status === 'suspended' || user.status === 'banned') {
      throw new Error('User not found or suspended');
    }

    const newPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(newPayload, JWT_SECRET, { expiresIn: '1d' });
    return { accessToken };
  } catch {
    throw new Error('Invalid or expired refresh token');
  }
}

async function forgotPassword(email) {
  const user = await User.findOne({ where: { email } });

  // Always return the same message to prevent email enumeration
  if (!user) {
    return { message: 'If that email is registered, you will receive a reset link shortly.' };
  }

  // Sign reset token with password hash embedded — auto-invalidated on password change
  const resetToken = jwt.sign(
    { id: user.id, type: 'password-reset' },
    JWT_SECRET + user.passwordHash.slice(-10),
    { expiresIn: '1h' }
  );

  const resetUrl = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;

  try {
    await sendForgotPasswordEmail(email, user.fullName, resetUrl);
  } catch (err) {
    // Log full detail for ops visibility; don't expose internals to the caller
    console.error('[ForgotPassword] Email dispatch failed:', err.message);
    throw new Error('Failed to send the password reset email. Please try again later.');
  }

  return { message: 'If that email is registered, you will receive a reset link shortly.' };
}

async function resetPassword(token, newPassword) {
  if (!token || !newPassword) throw new Error('Token and new password are required');
  if (newPassword.length < 8) throw new Error('Password must be at least 8 characters');

  // Decode URL-encoding in case the token came straight from a query string
  const rawToken = decodeURIComponent(token);

  let preliminary;
  try {
    preliminary = jwt.decode(rawToken);
  } catch {
    throw new Error('Invalid reset token');
  }

  if (!preliminary || !preliminary.id || preliminary.type !== 'password-reset') {
    throw new Error('Invalid reset token');
  }

  const user = await User.findByPk(preliminary.id);
  if (!user) throw new Error('Invalid reset token');

  try {
    jwt.verify(rawToken, JWT_SECRET + user.passwordHash.slice(-10));
  } catch {
    throw new Error('Reset token is invalid or has expired');
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await user.update({ passwordHash: newPasswordHash });

  try {
    await sendPasswordResetSuccessEmail(user.email, user.fullName);
  } catch (err) {
    console.error('[Email Error]', err.message);
  }

  try {
    await notificationService.notifyUser(
      user.id,
      'Password Changed',
      'Your Vendly account password has been successfully updated. If this was not you, contact support immediately.',
      'info'
    );
  } catch (err) {
    console.error('[Notification Error]', err.message);
  }

  return { message: 'Password has been reset successfully' };
}

async function updateProfile(userId, { username, bio, profileImage, password, currentPassword }) {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');

  const updates = {};
  const changes = [];

  if (username !== undefined && username !== user.username) {
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      throw new Error('Username must be 3–30 characters: lowercase letters, numbers, and underscores only');
    }
    const taken = await User.findOne({ where: { username, id: { [Op.ne]: userId } } });
    if (taken) throw new Error('Username already taken');
    updates.username = username;
    changes.push('username');
  }

  if (bio !== undefined) {
    updates.bio = bio;
    changes.push('bio');
  }

  if (profileImage !== undefined) {
    updates.profileImage = profileImage;
    changes.push('profile image');
  }

  if (password !== undefined) {
    if (!currentPassword) throw new Error('Current password is required to set a new password');
    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) throw new Error('Current password is incorrect');
    if (password.length < 8) throw new Error('New password must be at least 8 characters');
    updates.passwordHash = await bcrypt.hash(password, 10);
    changes.push('password');
  }

  if (Object.keys(updates).length === 0) throw new Error('No valid fields provided to update');

  await user.update(updates);

  // Sync updated username to wallet
  if (updates.username) {
    try {
      await Wallet.update({ username: updates.username }, { where: { userId } });
    } catch (err) {
      console.error('[Wallet Username Sync Error]', err.message);
    }
  }

  const changesSummary = changes.join(', ');

  try {
    await sendProfileUpdatedEmail(user.email, user.fullName, changesSummary);
  } catch (err) {
    console.error('[Email Error]', err.message);
  }

  try {
    await notificationService.notifyUser(
      userId,
      'Profile Updated',
      `Your profile has been updated: ${changesSummary}.`,
      'info'
    );
  } catch (err) {
    console.error('[Notification Error]', err.message);
  }

  const updated = await User.findByPk(userId, {
    attributes: ['id', 'fullName', 'username', 'email', 'phone', 'bio', 'profileImage', 'role', 'status']
  });

  return updated;
}

async function logout(userId) {
  try {
    await User.update(
      { isOnline: false, lastSeenAt: new Date() },
      { where: { id: userId } }
    );
  } catch (err) {
    console.error('[Logout Error]', err.message);
  }
  return { message: 'Logged out successfully' };
}

async function registerAdmin({ fullName, email, password, username, adminSecretKey }) {
  const ADMIN_SECRET = process.env.ADMIN_REGISTRATION_SECRET;

  if (!ADMIN_SECRET) throw new Error('Admin registration is not configured on this server');
  if (adminSecretKey !== ADMIN_SECRET) throw new Error('Invalid admin secret key');

  if (!fullName || !email || !password || !username) {
    throw new Error('fullName, email, password, and username are required');
  }

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    throw new Error('Username must be 3–30 characters: lowercase letters, numbers, and underscores only');
  }

  const [emailExists, usernameExists] = await Promise.all([
    User.findOne({ where: { email } }),
    User.findOne({ where: { username } })
  ]);

  if (emailExists) throw new Error('Email already registered');
  if (usernameExists) throw new Error('Username already taken');

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    fullName,
    username,
    email,
    passwordHash,
    role: 'admin',
    status: 'active',
    emailVerified: true,
    isVerified: true
  });

  try {
    await addWalletCreationJob(user.id, user.username);
  } catch (err) {
    console.error('[Queue Error] Admin wallet creation failed:', err.message);
  }

  try {
    await sendWelcomeEmail(email, fullName, username);
  } catch (err) {
    console.error('[Email Error]', err.message);
  }

  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role
    },
    accessToken,
    refreshToken
  };
}

module.exports = {
  registerUser,
  verifyUserEmail,
  loginUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  updateProfile,
  logout,
  registerAdmin
};
