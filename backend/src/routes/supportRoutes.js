const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

router.post('/', async (req, res, next) => {
  try {
    const { email, subject, message } = req.body;
    if (!email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'email, subject, and message are required' });
    }

    logger.info(`[SUPPORT] From: ${email} | Subject: ${subject} | Message: ${message.slice(0, 200)}`);

    // Send via Brevo if configured
    const apiKey = process.env.BREVO_API_KEY;
    const adminEmail = process.env.SUPPORT_EMAIL || process.env.BREVO_SENDER_EMAIL;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'support@vendly.app';

    if (apiKey && apiKey !== 'your_brevo_api_key_here' && adminEmail) {
      const payload = {
        sender: { name: `${email} via Vendly`, email: senderEmail },
        to: [{ email: adminEmail, name: 'Vendly Support' }],
        replyTo: { email },
        subject: `[Support] ${subject}`,
        htmlContent: `<p><strong>From:</strong> ${email}</p><p><strong>Subject:</strong> ${subject}</p><hr/><p>${message.replace(/\n/g, '<br/>')}</p>`
      };
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    res.json({ success: true, message: "Your message has been received. We'll get back to you within 24 hours." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
