import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.ETHEREAL_SMTP_HOST,
  port: Number(process.env.ETHEREAL_SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.ETHEREAL_SMTP_USER,
    pass: process.env.ETHEREAL_SMTP_PASSWORD,
  },
});

const info = await transporter.sendMail({
  from: process.env.ETHEREAL_SMTP_USER,
  to: "test@example.com",
  subject: "ReachInbox Test",
  text: "Testing Ethereal SMTP.",
});

console.log("Email sent!");
console.log("Message ID:", info.messageId);
console.log("Preview:", nodemailer.getTestMessageUrl(info));