const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, sequelize } = require('../models');
const { JWT_SECRET } = require('../middlewares/auth');
const { addWalletCreationJob } = require('../jobs/queue');
const { sendVerificationEmail } = require('../utils/mailer');

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'vendly_super_refresh_secret_key_12345';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

/**
 * Validates registration parameters and dispatches a verification email.
 * Does not write the user to the database yet.
 */
async function registerUser({ fullName, email, password }) {
  if (!fullName || !email || !password) {
    throw new Error('fullName, email, and password are required');
  }

  // Check if email already registered in DB
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Generate verification JWT token containing registration details (valid for 24 hours)
  const token = jwt.sign(
    { fullName, email, passwordHash },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  // Construct email verification link
  const verificationUrl = `${BACKEND_URL}/api/v1/auth/verify-email?token=${token}`;

  // Send verification email using Brevo
  await sendVerificationEmail(email, fullName, verificationUrl);

  return {
    email,
    verificationUrl // Returned for development/testing ease
  };
}

/**
 * Verifies email token, creates the user account as a buyer, and dispatches background wallet creation.
 */
async function verifyUserEmail(token) {
  if (!token) {
    throw new Error('Verification token is required');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw new Error('Invalid or expired verification token');
  }

  const { fullName, email, passwordHash } = decoded;

  // Confirm email isn't already registered
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new Error('Account already verified and created');
  }

  // Auto-generate a unique username based on the email prefix
  const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  let username = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Ensure username uniqueness in the unlikely case of a collision
  let usernameExists = await User.findOne({ where: { username } });
  while (usernameExists) {
    username = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;
    usernameExists = await User.findOne({ where: { username } });
  }

  // Create user inside a database transaction
  const transaction = await sequelize.transaction();
  let user;

  try {
    user = await User.create({
      fullName,
      username,
      email,
      passwordHash,
      role: 'buyer', // Default to buyer
      status: 'active',
      emailVerified: true,
      isVerified: true
    }, { transaction });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  // Dispatch background wallet creation
  try {
    await addWalletCreationJob(user.id);
  } catch (queueErr) {
    console.error(`[Queue Error] Failed to schedule wallet creation for user ${user.id}:`, queueErr.message);
  }

  // Generate application tokens
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

/**
 * Authenticates user credentials and returns tokens.
 */
async function loginUser({ email, password }) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (user.status === 'suspended' || user.status === 'banned') {
    throw new Error('Account has been suspended or banned. Please contact support.');
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new Error('Invalid email or password');
  }

  // Generate tokens
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

/**
 * Refreshes an expired access token using a refresh token.
 */
async function refreshAccessToken(refreshToken) {
  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    // Check if user still exists/active
    const user = await User.findByPk(payload.id);
    if (!user || user.status === 'suspended' || user.status === 'banned') {
      throw new Error('User not found or suspended');
    }

    const newPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(newPayload, JWT_SECRET, { expiresIn: '1d' });

    return { accessToken };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

module.exports = {
  registerUser,
  verifyUserEmail,
  loginUser,
  refreshAccessToken
};
