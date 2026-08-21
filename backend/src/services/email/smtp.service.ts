import nodemailer from 'nodemailer';

interface SendEmailInput {
  from: string;
  to: string;
  subject: string;
  text: string;
}

const smtpTransporter = nodemailer.createTransport({
  host: process.env.ETHEREAL_SMTP_HOST ?? 'smtp.ethereal.email',
  port: Number(process.env.ETHEREAL_SMTP_PORT ?? 587),
  secure: false,

  auth: {
    user: process.env.ETHEREAL_SMTP_USER,
    pass: process.env.ETHEREAL_SMTP_PASSWORD,
  },
});

export async function sendEmail({
  from,
  to,
  subject,
  text,
}: SendEmailInput) {
  const info = await smtpTransporter.sendMail({
    from,
    to,
    subject,
    text,
  });

  return {
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info),
  };
}