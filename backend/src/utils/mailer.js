const logger = require('./logger');
require('dotenv').config();

// Read at call-time so dotenv timing is never an issue
function getConfig() {
  return {
    apiKey: process.env.BREVO_API_KEY,
    senderEmail: process.env.BREVO_SENDER_EMAIL,
    senderName: process.env.BREVO_SENDER_NAME || 'Vendly'
  };
}

function isConfigured(apiKey) {
  return apiKey && apiKey !== 'your_brevo_api_key_here' && !apiKey.includes('placeholder');
}

async function dispatchEmail(to, name, subject, htmlContent) {
  const { apiKey, senderEmail, senderName } = getConfig();

  if (!isConfigured(apiKey)) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('BREVO_API_KEY is not set. Email delivery is required in production.');
    }
    logger.warn('┌─────────────────────────────────────────────────────┐');
    logger.warn('│  EMAIL NOT SENT — BREVO_API_KEY not set in .env     │');
    logger.warn('└─────────────────────────────────────────────────────┘');
    logger.info(`  To      : ${name} <${to}>`);
    logger.info(`  Subject : ${subject}`);
    return { success: true, simulated: true };
  }

  if (!senderEmail) {
    throw new Error('BREVO_SENDER_EMAIL is not set in environment variables.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to, name }],
        subject,
        htmlContent
      })
    });

    clearTimeout(timer);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const detail = body.message || `HTTP ${response.status}`;
      logger.error(`[MAILER] Brevo rejected "${subject}" to ${to}: ${detail}`);
      throw new Error(`Email delivery failed: ${detail}`);
    }

    const result = await response.json();
    logger.info(`[MAILER] Sent "${subject}" to ${to} (msgId: ${result.messageId})`);
    return { success: true, messageId: result.messageId };

  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Email request timed out after 15 seconds. Check your network or Brevo status.');
    }
    throw err;
  }
}

// ─── Brand colours (matches frontend globals.css --primary) ──────────────────
//   Primary   #f59e0b  amber-500
//   Dark      #d97706  amber-600  (header, strong accents)
//   Deeper    #b45309  amber-700  (hover, links)
//   Light bg  #fffbeb  amber-50   (highlight panels)
//   Light bdr #fde68a  amber-200  (highlight border)
//   Text dark #1c1917  stone-900
//   Text mid  #44403c  stone-700
//   Text mute #78716c  stone-500

const year = () => new Date().getFullYear();

// Shared wrapper — every template drops its <body> content into this shell
function wrap(preheader, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    /* Reset */
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0;mso-table-rspace:0}
    img{-ms-interpolation-mode:bicubic;border:0;display:block;max-width:100%}
    /* Layout */
    body{margin:0;padding:0;background:#f5f5f4;font-family:'Inter',ui-sans-serif,system-ui,-apple-system,sans-serif}
    .email-wrapper{width:100%;background:#f5f5f4;padding:32px 16px}
    .email-card{max-width:580px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07)}
    /* Header */
    .hdr{background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:32px 24px;text-align:center}
    .hdr-logo{color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;margin:0}
    .hdr-tagline{color:rgba(255,255,255,.85);font-size:13px;margin:4px 0 0}
    /* Body */
    .body{padding:36px 32px}
    .greeting{font-size:21px;font-weight:700;color:#1c1917;margin:0 0 12px}
    .body p{font-size:15px;line-height:1.75;color:#44403c;margin:0 0 18px}
    /* CTA button */
    .cta{text-align:center;margin:28px 0}
    .btn{display:inline-block;background:#f59e0b;color:#ffffff!important;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:.2px;box-shadow:0 4px 14px rgba(245,158,11,.35)}
    /* Highlight chip */
    .chip{background:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:8px;padding:14px 16px;margin:20px 0;font-size:14px;color:#44403c}
    .chip strong{color:#1c1917}
    /* Divider */
    .divider{border:none;border-top:1px solid #f5f5f4;margin:24px 0}
    /* Fine print */
    .fine{font-size:12px!important;color:#78716c!important;line-height:1.6}
    /* Footer */
    .ftr{background:#fafaf9;border-top:1px solid #f5f5f4;padding:20px 24px;text-align:center;font-size:11px;color:#78716c;line-height:1.6}
    /* Danger text */
    .danger{color:#dc2626;font-weight:600}
  </style>
</head>
<body>
  <!-- Preheader (hidden preview text) -->
  <span style="display:none;font-size:1px;color:#f5f5f4;max-height:0;overflow:hidden;opacity:0">${preheader}&nbsp;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;</span>

  <div class="email-wrapper">
    <div class="email-card">

      <div class="hdr">
        <p class="hdr-logo">Vendly</p>
        <p class="hdr-tagline">The Web3 Marketplace</p>
      </div>

      <div class="body">
        ${bodyHtml}
      </div>

      <div class="ftr">
        &copy; ${year()} Vendly &mdash; All rights reserved<br>
        You're receiving this because you have an account on Vendly.
      </div>

    </div>
  </div>
</body>
</html>`;
}

// ─── Templates ────────────────────────────────────────────────────────────────

async function sendVerificationEmail(email, fullName, verificationUrl) {
  const html = wrap(
    `Verify your email to activate your Vendly account`,
    `
    <p class="greeting">Hello ${fullName}!</p>
    <p>Thanks for signing up. Tap the button below to verify your email address and activate your account. We'll automatically set up your secure Celo Web3 wallet once you're in.</p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:28px auto">
      <tr>
        <td bgcolor="#f59e0b" style="border-radius:10px">
          <a href="${verificationUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;font-family:Arial,sans-serif;letter-spacing:.2px">Verify Email Address</a>
        </td>
      </tr>
    </table>
    <hr class="divider">
    <p class="fine">This link expires in <strong>24 hours</strong>. If you didn't create a Vendly account, you can safely ignore this email.</p>
    `
  );

  return dispatchEmail(email, fullName, 'Verify your Vendly account', html);
}

async function sendWelcomeEmail(email, fullName, username) {
  const html = wrap(
    `Welcome to Vendly, ${fullName}! Your account is ready.`,
    `
    <p class="greeting">You're in, ${fullName}! 🎉</p>
    <p>Your email is verified and your Vendly account is live. Your secure Celo Web3 wallet is being created in the background — you'll get a notification the moment it's ready.</p>
    <div class="chip">
      <strong>Your Vendly handle:</strong> @${username}<br>
      <span>People can find and pay you using this username across the marketplace.</span>
    </div>
    <p>You're set up as a <strong>buyer</strong>. Whenever you're ready, open a store to start selling.</p>
    <div class="cta">
      <a href="${process.env.FRONTEND_URL || 'https://vendly.com'}" class="btn">Explore the Marketplace</a>
    </div>
    `
  );

  return dispatchEmail(email, fullName, 'Welcome to Vendly — your account is ready', html);
}

async function sendForgotPasswordEmail(email, fullName, resetUrl) {
  const html = wrap(
    `Reset your Vendly password — link expires in 1 hour`,
    `
    <p class="greeting">Password reset request</p>
    <p>Hi ${fullName}, we received a request to reset the password on your Vendly account. Click the button below to choose a new password:</p>
    <div class="cta">
      <a href="${resetUrl}" class="btn">Reset My Password</a>
    </div>
    <hr class="divider">
    <p class="fine">This link is valid for <strong>1 hour</strong> and can only be used once. If you didn't request a password reset, your account is safe — just ignore this email.</p>
    `
  );

  return dispatchEmail(email, fullName, 'Reset your Vendly password', html);
}

async function sendPasswordResetSuccessEmail(email, fullName) {
  const html = wrap(
    `Your Vendly password has been changed`,
    `
    <p class="greeting">Password updated successfully</p>
    <p>Hi ${fullName}, your Vendly account password was just changed.</p>
    <p class="danger">If you did not make this change, contact our support team immediately — your account may be at risk.</p>
    `
  );

  return dispatchEmail(email, fullName, 'Your Vendly password has been changed', html);
}

async function sendProfileUpdatedEmail(email, fullName, changesSummary) {
  const html = wrap(
    `Your Vendly profile was updated`,
    `
    <p class="greeting">Profile updated</p>
    <p>Hi ${fullName}, the following changes were made to your Vendly profile:</p>
    <div class="chip"><strong>Fields changed:</strong> ${changesSummary}</div>
    <p class="fine">If you did not make these changes, contact support immediately.</p>
    `
  );

  return dispatchEmail(email, fullName, 'Your Vendly profile has been updated', html);
}

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendForgotPasswordEmail,
  sendPasswordResetSuccessEmail,
  sendProfileUpdatedEmail
};
