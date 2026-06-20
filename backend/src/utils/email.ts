import nodemailer from 'nodemailer';
import { config } from '../config';
import logger from './logger';
import { IEmailOptions } from '../../shared/types';

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
    logger.info(`Email sent to ${options.to}`);
  } catch (error) {
    logger.error('Email sending failed:', error);
  }
};

export const sendWelcomeEmail = async (to: string, name: string): Promise<void> => {
  await sendEmail({
    to,
    subject: 'Welcome to our E-Commerce Platform!',
    html: `
      <h1>Welcome, ${name}!</h1>
      <p>Thank you for joining our e-commerce platform.</p>
      <p>Start exploring our products and enjoy shopping!</p>
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
    subject: `Order Confirmation - ${orderNumber}`,
    html: `
      <h1>Order Confirmed!</h1>
      <p>Dear ${name},</p>
      <p>Your order ${orderNumber} has been confirmed.</p>
      <p>Total Amount: ₹${total}</p>
      <p>We'll notify you when your order ships.</p>
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
    subject: 'Password Reset Request',
    html: `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="padding:10px 20px;background:#4f46e5;color:white;text-decoration:none;border-radius:5px;">
        Reset Password
      </a>
      <p>This link expires in 10 minutes.</p>
    `,
  });
};
