import crypto from 'crypto';
import User from '../models/User';
import BackupCode from '../models/BackupCode';
import { BadRequestError } from '../utils/AppError';
import { sendEmail } from '../utils/email';
import logger from '../utils/logger';

/**
 * TOTP (Time-based One-Time Password) implementation using Node.js crypto.
 * For production, use the `otplib` and `qrcode` packages:
 *   npm install otplib qrcode
 *   npm install -D @types/qrcode
 *
 * Then replace the manual TOTP logic with:
 *   import { authenticator } from 'otplib';
 *   import QRCode from 'qrcode';
 */

export class TwoFactorService {
  generateSecret(userId: string, email: string): { secret: string; otpauth: string } {
    const secret = crypto.randomBytes(20).toString('base64').replace(/=/g, '').substring(0, 32);
    const serviceName = 'E-Commerce Platform';
    const otpauth = `otpauth://totp/${serviceName}:${email}?secret=${secret}&issuer=${serviceName}`;

    return { secret, otpauth };
  }

  async saveSecret(userId: string, secret: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { twoFactorSecret: secret });
  }

  generateTOTP(secret: string): string {
    const epoch = Math.floor(Date.now() / 30000);
    const counter = Buffer.alloc(8);
    counter.writeBigInt64BE(BigInt(epoch), 0);

    const key = Buffer.from(secret, 'base64');
    const hmac = crypto.createHmac('sha1', key).update(counter).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = ((hmac[offset] & 0x7f) << 24)
      | ((hmac[offset + 1] & 0xff) << 16)
      | ((hmac[offset + 2] & 0xff) << 8)
      | (hmac[offset + 3] & 0xff);
    const totp = String(code % 1000000).padStart(6, '0');
    return totp;
  }

  verifyTOTP(token: string, secret: string): boolean {
    const allowedDrift = 1;
    for (let i = -allowedDrift; i <= allowedDrift; i++) {
      const epoch = Math.floor(Date.now() / 30000) + i;
      const counter = Buffer.alloc(8);
      counter.writeBigInt64BE(BigInt(epoch), 0);
      const key = Buffer.from(secret, 'base64');
      const hmac = crypto.createHmac('sha1', key).update(counter).digest();
      const offset = hmac[hmac.length - 1] & 0xf;
      const code = ((hmac[offset] & 0x7f) << 24)
        | ((hmac[offset + 1] & 0xff) << 16)
        | ((hmac[offset + 2] & 0xff) << 8)
        | (hmac[offset + 3] & 0xff);
      const totp = String(code % 1000000).padStart(6, '0');
      if (totp === token) return true;
    }
    return false;
  }

  async verifyToken(userId: string, token: string): Promise<boolean> {
    const user = await User.findById(userId).select('+twoFactorSecret');
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestError('2FA not set up');
    }
    return this.verifyTOTP(token, user.twoFactorSecret);
  }

  async enableTwoFactor(userId: string, token: string, method: 'totp' | 'email'): Promise<void> {
    const user = await User.findById(userId).select('+twoFactorSecret');
    if (!user) throw new BadRequestError('User not found');

    if (method === 'totp') {
      if (!user.twoFactorSecret) throw new BadRequestError('2FA not set up. Generate a secret first.');
      const isValid = this.verifyTOTP(token, user.twoFactorSecret);
      if (!isValid) throw new BadRequestError('Invalid 2FA token. Please try again.');
    }

    await User.findByIdAndUpdate(userId, {
      twoFactorEnabled: true,
      twoFactorMethod: method,
    });
  }

  async disableTwoFactor(userId: string, password: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new BadRequestError('User not found');
    if (!user.password) throw new BadRequestError('Cannot disable 2FA for OAuth-only accounts');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new BadRequestError('Invalid password');

    await User.findByIdAndUpdate(userId, {
      twoFactorEnabled: false,
      twoFactorMethod: undefined,
      twoFactorSecret: undefined,
    });

    await BackupCode.deleteMany({ user: userId });
  }

  async generateBackupCodes(userId: string): Promise<string[]> {
    await BackupCode.deleteMany({ user: userId });

    const codes: string[] = [];
    const codeDocs: Array<{ user: any; code: string }> = [];

    for (let i = 0; i < 10; i++) {
      const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
      const formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
      codes.push(formatted);
      codeDocs.push({ user: userId, code: formatted });
    }

    await BackupCode.insertMany(codeDocs);
    return codes;
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const backupCode = await BackupCode.findOne({
      user: userId,
      code: code.toUpperCase(),
      usedAt: { $exists: false },
    });

    if (!backupCode) return false;

    backupCode.usedAt = new Date();
    await backupCode.save();
    return true;
  }

  async getRemainingBackupCodes(userId: string): Promise<number> {
    return BackupCode.countDocuments({
      user: userId,
      usedAt: { $exists: false },
    });
  }

  async sendEmailOTP(userId: string, email: string): Promise<void> {
    const otp = crypto.randomInt(100000, 999999).toString();
    const user = await User.findById(userId).select('+twoFactorSecret');
    if (!user) throw new BadRequestError('User not found');

    user.twoFactorSecret = otp;
    await user.save();

    await sendEmail({
      to: email,
      subject: 'Your 2FA Verification Code',
      html: `
        <h1>Two-Factor Authentication</h1>
        <p>Your verification code is:</p>
        <h2 style="letter-spacing: 5px; font-size: 32px; text-align: center; color: #4f46e5;">${otp}</h2>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this, please secure your account immediately by changing your password.</p>
        <hr>
        <p style="color: #6b7280; font-size: 12px;">E-Commerce Platform - Security Team</p>
      `,
    });

    logger.info(`2FA OTP sent to ${email}`);
  }

  async verifyEmailOTP(userId: string, otp: string): Promise<boolean> {
    const user = await User.findById(userId).select('+twoFactorSecret');
    if (!user || !user.twoFactorSecret) return false;

    const isValid = user.twoFactorSecret === otp;
    if (isValid) {
      user.twoFactorSecret = undefined;
      await user.save();
    }
    return isValid;
  }
}
