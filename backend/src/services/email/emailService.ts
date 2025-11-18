import { Resend } from 'resend';
import { config } from '../../config/env';
import logger from '../../utils/logger';

const resend = new Resend(config.resendApiKey);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    if (!config.resendApiKey) {
      logger.warn('Resend API key not configured. Email not sent.');
      return;
    }

    const { data, error } = await resend.emails.send({
      from: options.from || config.emailFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      logger.error('Error sending email:', error);
      throw error;
    }

    logger.info(`Email sent successfully to ${options.to}`);
  } catch (error) {
    logger.error('Error in sendEmail:', error);
    throw error;
  }
};

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verificationUrl = `${config.frontendUrl}/verify-email/${token}`;
  
  const html = `
    <h1>Verify Your Email</h1>
    <p>Please click the link below to verify your email address:</p>
    <a href="${verificationUrl}">${verificationUrl}</a>
    <p>This link will expire in 24 hours.</p>
  `;

  await sendEmail({
    to: email,
    subject: 'Verify Your Email - SquirrelSquad Academy',
    html,
  });
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const resetUrl = `${config.frontendUrl}/reset-password/${token}`;
  
  const html = `
    <h1>Reset Your Password</h1>
    <p>Please click the link below to reset your password:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>This link will expire in 10 minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your Password - SquirrelSquad Academy',
    html,
  });
};

export const sendCourseEnrollmentEmail = async (email: string, courseTitle: string): Promise<void> => {
  const html = `
    <h1>Course Enrollment Confirmation</h1>
    <p>You have successfully enrolled in: <strong>${courseTitle}</strong></p>
    <p>Start learning now!</p>
  `;

  await sendEmail({
    to: email,
    subject: `Enrolled in ${courseTitle} - SquirrelSquad Academy`,
    html,
  });
};

export const sendPurchaseConfirmationEmail = async (email: string, amount: number, subscriptionTier: string): Promise<void> => {
  const html = `
    <h1>Purchase Confirmation</h1>
    <p>Thank you for your purchase!</p>
    <p>Amount: $${amount}</p>
    <p>Subscription Tier: ${subscriptionTier}</p>
  `;

  await sendEmail({
    to: email,
    subject: 'Purchase Confirmation - SquirrelSquad Academy',
    html,
  });
};

