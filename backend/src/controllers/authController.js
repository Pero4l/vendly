const authService = require("../services/authService");
const { User, Wallet } = require("../models");

async function register(req, res, next) {
  try {
    const { fullName, email, password, username } = req.body;
    if (!fullName || !email || !password || !username) {
      return res
        .status(400)
        .json({
          success: false,
          message: "fullName, email, password, and username are required",
        });
    }

    // if (password.length < 6) {
    //   return res.status(400).json({ message: "Password must be at least 6 characters" });
    // } else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
    //   return res.status(400).json({ message: "Password must contain both uppercase and lowercase letters" });
    // } else if (!/[0-9]/.test(password)) {
    //   return res.status(400).json({ message: "Password must contain a number" });
    // } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    //   return res.status(400).json({ message: "Invalid email format" });
    // } else if (full_name.length < 5) {
    //   return res.status(400).json({ message: "Name must be at least 5 characters" });
    // }

    // const existingUser = await Users.findOne({ where: { email } });
    // if (existingUser) {
    //   return res.status(400).json({ success: false, message: "User already exists" });
    // }

    // const hashedPassword = await bcrypt.hash(password, 12);

    const result = await authService.registerUser({
      fullName,
      email,
      password,
      username,
    });
    res.status(200).json({
      success: true,
      message:
        "Verification email sent. Please check your inbox to activate your account.",
      data: { email: result.email },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Token is required" });
    }

    const data = await authService.verifyUserEmail(token);

    const acceptHeader = req.headers["accept"] || "";
    if (acceptHeader.includes("text/html")) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Account Verified - Vendly</title>
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 60px 20px; background-color: #f8fafc; margin: 0; }
            .card { background: #ffffff; padding: 40px; border-radius: 16px; max-width: 480px; margin: auto; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
            .icon { width: 64px; height: 64px; background-color: #fef9c3; color: #eab308; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 32px; font-weight: bold; }
            h1 { color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 12px; }
            p { color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 28px; }
            .btn { display: inline-block; padding: 14px 28px; background: #eab308; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; }
          </style>
          <script>setTimeout(() => { window.location.href = "${frontendUrl}/login?verified=true"; }, 4000);</script>
        </head>
        <body>
          <div class="card">
            <div class="icon">&#10003;</div>
            <h1>Email Verified!</h1>
            <p>Your Vendly account has been verified. Your secure Web3 wallet is being created in the background.</p>
            <p style="font-size: 14px; color: #94a3b8; margin-top: -12px;">Redirecting to login shortly...</p>
            <a class="btn" href="${frontendUrl}/login">Go to Login</a>
          </div>
        </body>
        </html>
      `);
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Email verified and account created successfully",
        data,
      });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function login(req, res, next) {
  try {
    // Accept either `identifier` (new) or `email` (legacy) for backwards compatibility
    const identifier = req.body.identifier || req.body.email;
    const { password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Email/username/phone and password are required",
        });
    }

    const data = await authService.loginUser({ identifier, password });
    res
      .status(200)
      .json({ success: true, message: "Logged in successfully", data });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh token required" });
    }

    const data = await authService.refreshAccessToken(refreshToken);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        "id",
        "fullName",
        "username",
        "email",
        "phone",
        "bio",
        "profileImage",
        "role",
        "status",
        "isVerified",
        "emailVerified",
        "lastLoginAt",
        "createdAt",
      ],
      include: [
        {
          model: Wallet,
          as: "wallet",
          attributes: ["address", "username", "isActive"],
        },
      ],
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

// Alias — same as getProfile but semantically named for "current session user"
const getMe = getProfile;

async function updateProfile(req, res, next) {
  try {
    const { username, bio, profileImage, password, currentPassword } = req.body;
    const data = await authService.updateProfile(req.user.id, {
      username,
      bio,
      profileImage,
      password,
      currentPassword,
    });
    res
      .status(200)
      .json({ success: true, message: "Profile updated successfully", data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const result = await authService.forgotPassword(email);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Token and new password are required",
        });
    }

    const result = await authService.resetPassword(token, password);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function logout(req, res, next) {
  try {
    const result = await authService.logout(req.user.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
}

async function registerAdmin(req, res, next) {
  try {
    const { fullName, email, password, username, adminSecretKey } = req.body;
    if (!fullName || !email || !password || !username || !adminSecretKey) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "fullName, email, password, username, and adminSecretKey are required",
        });
    }

    const data = await authService.registerAdmin({
      fullName,
      email,
      password,
      username,
      adminSecretKey,
    });
    res
      .status(201)
      .json({
        success: true,
        message: "Admin account created successfully",
        data,
      });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
}

module.exports = {
  register,
  verifyEmail,
  login,
  refresh,
  getProfile,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  logout,
  registerAdmin,
};
