const authService = require('../services/authService');
const { User, Wallet } = require('../models');

async function register(req, res, next) {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'fullName, email, and password are required' });
    }

    const result = await authService.registerUser({ fullName, email, password });
    res.status(200).json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
      data: {
        email: result.email,
        verificationUrl: result.verificationUrl // Included for API testing convenience
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }

    const data = await authService.verifyUserEmail(token);

    // If request accepts HTML (browser click), return a beautiful redirect page
    const acceptHeader = req.headers['accept'] || '';
    if (acceptHeader.includes('text/html')) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Account Verified - Vendly</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              text-align: center;
              padding: 60px 20px;
              background-color: #f8fafc;
              margin: 0;
            }
            .card {
              background: #ffffff;
              padding: 40px;
              border-radius: 16px;
              max-width: 480px;
              margin: auto;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
              border: 1px solid #e2e8f0;
            }
            .icon {
              width: 64px;
              height: 64px;
              background-color: #fef9c3;
              color: #eab308;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 24px auto;
              font-size: 32px;
              font-weight: bold;
            }
            h1 {
              color: #0f172a;
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 12px;
            }
            p {
              color: #475569;
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 28px;
            }
            .btn {
              display: inline-block;
              padding: 14px 28px;
              background: #eab308;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              box-shadow: 0 4px 6px -1px rgba(234, 179, 8, 0.2);
              transition: all 0.2s;
            }
            .btn:hover {
              background: #ca8a04;
            }
          </style>
          <script>
            setTimeout(() => {
              window.location.href = "${frontendUrl}/login?verified=true";
            }, 4000);
          </script>
        </head>
        <body>
          <div class="card">
            <div class="icon">&check;</div>
            <h1>Email Verified!</h1>
            <p>Your Vendly account has been verified successfully. We are creating your secure Web3 wallet in the background.</p>
            <p style="font-size: 14px; color: #94a3b8; margin-top: -12px;">You will be redirected to the login page shortly...</p>
            <a class="btn" href="${frontendUrl}/login">Go to Login</a>
          </div>
        </body>
        </html>
      `);
    }

    res.status(200).json({
      success: true,
      message: 'Email verified and account created successfully',
      data
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Missing credentials' });
    }

    const data = await authService.loginUser({ email, password });
    res.status(200).json({ success: true, message: 'Logged in successfully', data });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
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
      attributes: ['id', 'fullName', 'username', 'email', 'role', 'status', 'profileImage', 'createdAt'],
      include: [{ model: Wallet, as: 'wallet', attributes: ['address'] }]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  verifyEmail,
  login,
  refresh,
  getProfile
};
