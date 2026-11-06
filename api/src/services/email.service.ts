import nodemailer from 'nodemailer';
import { env } from '../config';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_APP_PASSWORD,
  },
});

export async function sendVerificationEmail(
  email: string,
  verificationUrl: string
): Promise<void> {
  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject: 'Verify your JobLens account',
    text: `
Welcome to JobLens!

Please verify your email address by opening this link:

${verificationUrl}

If you did not create this account, you can ignore this email.
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Welcome to JobLens!</h2>
        <p>Thanks for creating an account.</p>
        <p>Please verify your email address by clicking below:</p>
        <a
          href="${verificationUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          Verify Email
        </a>
        <p>If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  });
}