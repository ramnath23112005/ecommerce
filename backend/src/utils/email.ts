import nodemailer from 'nodemailer';
import { config } from '../config';
import logger from './logger';
import { IEmailOptions } from '../../../shared/types';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export const sendEmail = async (options: IEmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: `"E-Commerce" <${config.email.from}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };
    await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    logger.error('Email sending failed:', error);
  }
};

export const sendWelcomeEmail = async (to: string, name: string): Promise<void> => {
  await sendEmail({
    to,
    subject: 'Welcome to our E-Commerce Platform!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome, ${name}!</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p>Thank you for joining our e-commerce platform.</p>
          <p>Start exploring our products and enjoy shopping!</p>
          <a href="${config.frontendUrl}/products" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">Browse Products</a>
        </div>
      </div>
    `,
  });
};

export const sendEmailVerificationEmail = async (to: string, token: string): Promise<void> => {
  const verifyUrl = `${config.frontendUrl}/verify-email/${token}`;
  await sendEmail({
    to,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Verify Your Email</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">Verify Email</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't create an account, ignore this email.</p>
        </div>
      </div>
    `,
  });
};

export const sendOrderConfirmationEmail = async (
  to: string,
  name: string,
  orderNumber: string,
  total: number
): Promise<void> => {
  await sendEmail({
    to,
    subject: `Order Confirmed - ${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Order Confirmed!</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p>Dear ${name},</p>
          <p>Your order <strong>${orderNumber}</strong> has been confirmed.</p>
          <p style="font-size: 24px; font-weight: bold; color: #4f46e5;">Total: ₹${total}</p>
          <p>We'll notify you when your order ships.</p>
          <a href="${config.frontendUrl}/orders/${orderNumber}" style="display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px;">Track Order</a>
        </div>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${config.frontendUrl}/reset-password/${resetToken}`;
  await sendEmail({
    to,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626, #f59e0b); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Reset Password</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This link expires in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 12px;">If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  });
};

export const sendSuspiciousLoginAlert = async (
  to: string,
  name: string,
  ip: string
): Promise<void> => {
  await sendEmail({
    to,
    subject: 'Suspicious Login Detected',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626, #f59e0b); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Suspicious Login</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p>Dear ${name},</p>
          <p>We detected a login from a new device or location.</p>
          <p><strong>IP Address:</strong> ${ip}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p>If this was you, you can ignore this email. Otherwise, secure your account immediately:</p>
          <a href="${config.frontendUrl}/profile/security" style="display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px;">Secure Account</a>
        </div>
      </div>
    `,
  });
};
