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

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject: 'Reset your JobLens password',
    text: `
We received a request to reset your JobLens password.

To choose a new password, open this link:

${resetUrl}

This link expires in 15 minutes and can only be used once.

If you did not request a password reset, you can ignore this email.
Your current password will remain unchanged.
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Reset your JobLens password</h2>
        <p>We received a request to reset your password.</p>
        <p>Click the button below to choose a new password:</p>
        <a
          href="${resetUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          Reset Password
        </a>
        <p>This link expires in 15 minutes and can only be used once.</p>
        <p>If you did not request a password reset, you can ignore this email.</p>
      </div>
    `,
  });
}