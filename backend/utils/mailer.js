import nodemailer from 'nodemailer';

let cachedTransporter = null;
let isEthereal = false;

export async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  // Prefer real SMTP if env is configured
  if (process.env.SMTP_HOST) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
    isEthereal = false;
  } else {
    // Development fallback: Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    isEthereal = true;
  }

  try {
    await cachedTransporter.verify();
    console.log(
      `SMTP ready: ${isEthereal ? 'Ethereal (dev preview only)' : process.env.SMTP_HOST}`
    );
  } catch (err) {
    console.error('SMTP verification failed:', err?.message || err);
  }

  return cachedTransporter;
}

export async function sendMail(options) {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: options.from || process.env.EMAIL_FROM || 'no-reply@excel-analytics.local',
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });

  const previewUrl = isEthereal ? nodemailer.getTestMessageUrl(info) : null;
  return { info, previewUrl };
}


