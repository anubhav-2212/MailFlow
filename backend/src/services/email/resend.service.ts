import { Resend } from 'resend';

interface SendEmailInput {
  from: string;
  to: string;
  subject: string;
  text: string;
}

const resend = new Resend(
  process.env.RESEND_API_KEY,
);

export async function sendEmailWithResend({
  from,
  to,
  subject,
  text,
}: SendEmailInput) {
  const recipient =
    process.env.RESEND_TEST_MODE === 'true'
      ? 'delivered@resend.dev'
      : to;

  const sender =
    process.env.RESEND_FROM_EMAIL ?? from;

  const { data, error } = await resend.emails.send({
    from: sender,
    to: recipient,
    subject,
    text,
  });

  if (error) {
    throw new Error(
      `Resend email failed: ${error.message}`,
    );
  }

  if (!data?.id) {
    throw new Error(
      'Resend did not return an email ID',
    );
  }

  return {
    messageId: data.id,
    previewUrl: null,
  };
}