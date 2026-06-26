const logger = require('./logger');

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'no-reply@vendly.com';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Vendly Support';

/**
 * Sends a registration verification email using Brevo.
 * If no API key is provided or the key is a placeholder, it falls back to console logging.
 * 
 * @param {string} email Recipient email address
 * @param {string} fullName Recipient full name
 * @param {string} verificationUrl The email verification link
 */
async function sendVerificationEmail(email, fullName, verificationUrl) {
  const isPlaceholderKey = !BREVO_API_KEY || BREVO_API_KEY === 'xkeysib-placeholder-key' || BREVO_API_KEY.includes('placeholder');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify your Vendly Account</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: #f7f9fa;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #e1e8ed;
        }
        .header {
          background-color: #EAB308; /* Yellow/Gold Accent */
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .content {
          padding: 40px 30px;
          color: #1e293b;
        }
        .content h2 {
          font-size: 20px;
          margin-top: 0;
          font-weight: 600;
        }
        .content p {
          font-size: 16px;
          line-height: 1.6;
          color: #475569;
        }
        .btn-container {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          background-color: #EAB308;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 30px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          box-shadow: 0 2px 5px rgba(234, 179, 8, 0.3);
        }
        .footer {
          background-color: #f8fafc;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
          border-top: 1px solid #f1f5f9;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Vendly Marketplace</h1>
        </div>
        <div class="content">
          <h2>Welcome to Vendly, ${fullName}!</h2>
          <p>Thank you for registering. To activate your account and set up your secure wallet, please verify your email address by clicking the button below:</p>
          <div class="btn-container">
            <a href="${verificationUrl}" class="btn">Verify Email Address</a>
          </div>
          <p>This verification link is valid for 24 hours. If you did not sign up for a Vendly account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Vendly. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (isPlaceholderKey) {
    logger.info('----------------------------------------------------');
    logger.info('DEVELOPMENT EMAIL SIMULATION:');
    logger.info(`To: ${fullName} <${email}>`);
    logger.info('Subject: Verify your Vendly Account');
    logger.info(`Verification URL: ${verificationUrl}`);
    logger.info('----------------------------------------------------');
    return { success: true, simulated: true };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email, name: fullName }],
        subject: 'Verify your Vendly Account',
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error ${response.status}`);
    }

    const result = await response.json();
    logger.info(`Verification email successfully sent to ${email} (Brevo MessageId: ${result.messageId})`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    logger.error(`Failed to send email to ${email} via Brevo:`, error.message);
    throw new Error(`Email dispatch failed: ${error.message}`);
  }
}

module.exports = {
  sendVerificationEmail
};
