import 'dotenv/config';

import { sendEmailWithResend } from '../services/email/resend.service.js';

const result = await sendEmailWithResend({
  from: 'onboarding@resend.dev',
  to: 'delivered@resend.dev',
  subject: 'ReachInbox Resend Test',
  text: 'Testing Resend from ReachInbox.',
});

console.log('Email sent:', result);