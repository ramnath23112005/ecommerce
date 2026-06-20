import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { UserRepository } from '../repositories/UserRepository';
import { BadRequestError, UnauthorizedError } from '../utils/AppError';
import { IJWTPayload, IUser } from '../../../shared/types';
import { UserRole } from '../../../shared/enums';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/email';

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  generateTokens(payload: IJWTPayload): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });
    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as any,
    });
    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): IJWTPayload {
    return jwt.verify(token, config.jwt.secret) as IJWTPayload;
  }

  verifyRefreshToken(token: string): IJWTPayload {
    return jwt.verify(token, config.jwt.refreshSecret) as IJWTPayload;
  }

  async register(
    name: string,
    email: string,
    password: string
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new BadRequestError('Email already registered');
    }

    const user = await this.userRepo.create({
      name,
      email,
      password,
      role: UserRole.CUSTOMER,
    } as any);

    const tokens = this.generateTokens({ id: user._id.toString(), email: user.email, role: user.role });
    await this.userRepo.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    await sendWelcomeEmail(user.email, user.name);

    return { user: user.toJSON(), ...tokens };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findByEmailWithPassword(email);
    if (!user || !user.password) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = this.generateTokens({ id: user._id.toString(), email: user.email, role: user.role });
    await this.userRepo.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return { user: user.toJSON(), ...tokens };
  }

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const decoded = this.verifyRefreshToken(token);
    const user = await this.userRepo.findById(decoded.id);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const payload: IJWTPayload = { id: user._id.toString(), email: user.email, role: user.role };
    const tokens = this.generateTokens(payload);
    await this.userRepo.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.userRepo.updateRefreshToken(userId, null);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await this.userRepo.update(user._id.toString(), {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: new Date(Date.now() + 10 * 60 * 1000),
    } as any);

    await sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.userRepo.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
  }

  async googleLogin(profile: any): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const email = profile.emails?.[0]?.value;
    let user = await this.userRepo.findByGoogleId(profile.id);

    if (!user && email) {
      user = await this.userRepo.findByEmail(email);
      if (user) {
        user.googleId = profile.id;
        await user.save();
      }
    }

    if (!user) {
      user = await this.userRepo.create({
        name: profile.displayName,
        email,
        googleId: profile.id,
        role: UserRole.CUSTOMER,
        isEmailVerified: true,
        avatar: profile.photos?.[0]?.value,
      } as any);
    }

    const tokens = this.generateTokens({ id: user._id.toString(), email: user.email, role: user.role });
    await this.userRepo.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return { user: user.toJSON(), ...tokens };
  }
}
