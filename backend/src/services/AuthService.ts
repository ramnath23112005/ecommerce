import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { UserRepository } from '../repositories/UserRepository';
import { SessionService } from './SessionService';
import { TwoFactorService } from './TwoFactorService';
import { BadRequestError, UnauthorizedError, ForbiddenError, TooManyRequestsError } from '../utils/AppError';
import { IJWTPayload, IUser } from '../../../shared/types';
import { UserRole, LoginMethod, LoginStatus, VerificationType } from '../../../shared/enums';
import { sendWelcomeEmail, sendPasswordResetEmail, sendEmailVerificationEmail, sendSuspiciousLoginAlert } from '../utils/email';
import UserSession from '../models/UserSession';
import VerificationToken from '../models/VerificationToken';
import LoginHistory from '../models/LoginHistory';
import logger from '../utils/logger';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export class AuthService {
  private userRepo: UserRepository;
  private sessionService: SessionService;
  private twoFactorService: TwoFactorService;

  constructor() {
    this.userRepo = new UserRepository();
    this.sessionService = new SessionService();
    this.twoFactorService = new TwoFactorService();
  }

  generateTokens(payload: IJWTPayload): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(
      { ...payload, jti: uuidv4() },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as any }
    );
    const refreshToken = jwt.sign(
      { ...payload, jti: uuidv4() },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn as any }
    );
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
    password: string,
    deviceInfo?: { userAgent: string; ip: string; platform: string; browser: string }
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string; requiresEmailVerification: boolean }> {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new BadRequestError('Email already registered');
    }

    const user = await this.userRepo.create({
      name,
      email,
      password,
      role: UserRole.CUSTOMER,
      isEmailVerified: false,
      loginAttempts: 0,
    } as any);

    const tokens = this.generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId: uuidv4(),
    });

    await this.sessionService.createSession(
      user._id.toString(),
      tokens.refreshToken,
      {
        userAgent: deviceInfo?.userAgent || '',
        ip: deviceInfo?.ip || '',
        platform: deviceInfo?.platform || '',
        browser: deviceInfo?.browser || '',
      }
    );

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    await VerificationToken.create({
      user: user._id,
      token: hashedToken,
      type: VerificationType.EMAIL_VERIFY,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    try {
      await sendEmailVerificationEmail(user.email, verificationToken);
    } catch (err) {
      logger.error('Failed to send verification email', err);
    }

    return {
      user: user.toJSON() as unknown as IUser,
      ...tokens,
      requiresEmailVerification: true,
    };
  }

  async verifyEmail(token: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const verificationToken = await VerificationToken.findOne({
      token: hashedToken,
      type: VerificationType.EMAIL_VERIFY,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    if (!verificationToken) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    const user = await this.userRepo.findById(verificationToken.user.toString());
    if (!user) throw new BadRequestError('User not found');

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    verificationToken.usedAt = new Date();
    await verificationToken.save();
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return;
    if (user.isEmailVerified) throw new BadRequestError('Email already verified');

    await VerificationToken.deleteMany({
      user: user._id,
      type: VerificationType.EMAIL_VERIFY,
      usedAt: { $exists: false },
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    await VerificationToken.create({
      user: user._id,
      token: hashedToken,
      type: VerificationType.EMAIL_VERIFY,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await sendEmailVerificationEmail(user.email, verificationToken);
  }

  async login(
    email: string,
    password: string,
    deviceInfo?: { userAgent: string; ip: string; platform: string; browser: string }
  ): Promise<{
    user: IUser;
    accessToken: string;
    refreshToken: string;
    requiresTwoFactor: boolean;
    session: any;
  }> {
    const user = await this.userRepo.findByEmailWithPassword(email);
    if (!user || !user.password) {
      await this.recordLoginAttempt(null, email, LoginMethod.EMAIL, LoginStatus.FAILED, deviceInfo, 'Invalid credentials');
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.canLogin()) {
      const remainingMinutes = Math.ceil(((user.lockUntil?.getTime() || 0) - Date.now()) / 60000);
      await this.recordLoginAttempt(user._id.toString(), email, LoginMethod.EMAIL, LoginStatus.BLOCKED, deviceInfo, 'Account locked');
      throw new TooManyRequestsError(`Account locked. Try again in ${remainingMinutes} minutes`);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.isLocked = true;
        user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        await user.save();
        await this.recordLoginAttempt(user._id.toString(), email, LoginMethod.EMAIL, LoginStatus.BLOCKED, deviceInfo, 'Max login attempts exceeded');
        throw new TooManyRequestsError(`Account locked due to ${MAX_LOGIN_ATTEMPTS} failed attempts. Try again in ${LOCKOUT_DURATION_MINUTES} minutes`);
      }
      await user.save();
      const remaining = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
      await this.recordLoginAttempt(user._id.toString(), email, LoginMethod.EMAIL, LoginStatus.FAILED, deviceInfo, `Invalid password (${remaining} attempts remaining)`);
      throw new UnauthorizedError(`Invalid email or password. ${remaining} attempts remaining`);
    }

    user.loginAttempts = 0;
    user.lastLogin = new Date();
    user.lastLoginIp = deviceInfo?.ip || '';

    const suspiciousReason = await this.sessionService.detectSuspiciousLogin(
      user._id.toString(),
      deviceInfo?.ip || '',
      deviceInfo?.userAgent || ''
    );

    if (suspiciousReason) {
      await this.recordLoginAttempt(user._id.toString(), email, LoginMethod.EMAIL, LoginStatus.SUSPICIOUS, deviceInfo, suspiciousReason);
      try {
        await sendSuspiciousLoginAlert(user.email, user.name, deviceInfo?.ip || '');
      } catch (err) {
        logger.error('Failed to send suspicious login alert', err);
      }
    }

    if (user.twoFactorEnabled) {
      if (user.twoFactorMethod === 'email') {
        await this.twoFactorService.sendEmailOTP(user._id.toString(), user.email);
      }
      await user.save();
      return {
        user: user.toJSON() as unknown as IUser,
        accessToken: '',
        refreshToken: '',
        requiresTwoFactor: true,
        session: null,
      };
    }

    const tokens = this.generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId: uuidv4(),
    });

    const session = await this.sessionService.createSession(
      user._id.toString(),
      tokens.refreshToken,
      {
        userAgent: deviceInfo?.userAgent || '',
        ip: deviceInfo?.ip || '',
        platform: deviceInfo?.platform || '',
        browser: deviceInfo?.browser || '',
      }
    );

    await user.save();

    await this.recordLoginAttempt(user._id.toString(), email, LoginMethod.EMAIL, LoginStatus.SUCCESS, deviceInfo);

    return {
      user: user.toJSON() as unknown as IUser,
      ...tokens,
      requiresTwoFactor: false,
      session,
    };
  }

  async verifyTwoFactor(
    userId: string,
    token: string,
    deviceInfo?: { userAgent: string; ip: string; platform: string; browser: string }
  ): Promise<{ accessToken: string; refreshToken: string; session: any }> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UnauthorizedError('User not found');

    let isValid = false;

    if (user.twoFactorMethod === 'totp') {
      isValid = await this.twoFactorService.verifyToken(userId, token);
    } else if (user.twoFactorMethod === 'email') {
      isValid = await this.twoFactorService.verifyEmailOTP(userId, token);
    }

    if (!isValid) {
      isValid = await this.twoFactorService.verifyBackupCode(userId, token);
    }

    if (!isValid) throw new BadRequestError('Invalid 2FA code');

    const tokens = this.generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId: uuidv4(),
    });

    const session = await this.sessionService.createSession(
      user._id.toString(),
      tokens.refreshToken,
      {
        userAgent: deviceInfo?.userAgent || '',
        ip: deviceInfo?.ip || '',
        platform: deviceInfo?.platform || '',
        browser: deviceInfo?.browser || '',
      }
    );

    await this.recordLoginAttempt(user._id.toString(), user.email, LoginMethod.EMAIL, LoginStatus.SUCCESS, deviceInfo);

    return { ...tokens, session };
  }

  async refreshToken(
    oldToken: string,
    deviceInfo?: { userAgent: string; ip: string }
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let decoded: IJWTPayload;
    try {
      decoded = this.verifyRefreshToken(oldToken);
    } catch {
      if (oldToken) {
        await this.sessionService.revokeSession(oldToken).catch(() => {});
      }
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await this.userRepo.findById(decoded.id);
    if (!user) {
      await this.sessionService.revokeSession(oldToken).catch(() => {});
      throw new UnauthorizedError('User not found');
    }

    const session = await this.sessionService.findSessionByRefreshToken(oldToken);
    if (!session) {
      await this.sessionService.revokeAllUserSessions(decoded.id);
      throw new UnauthorizedError('Session has been revoked. All sessions terminated for security.');
    }

    const tokens = this.generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId: uuidv4(),
    });

    await this.sessionService.rotateSession(oldToken, tokens.refreshToken);

    if (deviceInfo?.ip) {
      session.lastActivity = new Date();
      if (deviceInfo.userAgent) session.deviceInfo.userAgent = deviceInfo.userAgent;
      if (deviceInfo.ip) session.deviceInfo.ip = deviceInfo.ip;
      await session.save();
    }

    return tokens;
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.sessionService.revokeSession(refreshToken);
    } else {
      await this.sessionService.revokeAllUserSessions(userId);
    }
    await this.userRepo.updateRefreshToken(userId, null);
  }

  async logoutAllDevices(userId: string, excludeToken?: string): Promise<void> {
    await this.sessionService.revokeAllUserSessions(userId, excludeToken);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return;

    await VerificationToken.deleteMany({
      user: user._id,
      type: VerificationType.PASSWORD_RESET,
      usedAt: { $exists: false },
    });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await VerificationToken.create({
      user: user._id,
      token: hashedToken,
      type: VerificationType.PASSWORD_RESET,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const verificationToken = await VerificationToken.findOne({
      token: hashedToken,
      type: VerificationType.PASSWORD_RESET,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    if (!verificationToken) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const user = await this.userRepo.findById(verificationToken.user.toString());
    if (!user) throw new BadRequestError('User not found');

    user.password = newPassword;
    await user.save();

    verificationToken.usedAt = new Date();
    await verificationToken.save();

    await this.sessionService.revokeAllUserSessions(user._id.toString());
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new BadRequestError('User not found');

    const userWithPassword = await this.userRepo.findByEmailWithPassword(user.email);
    if (!userWithPassword || !userWithPassword.password) {
      throw new BadRequestError('Password change not available for OAuth accounts');
    }

    const isMatch = await userWithPassword.comparePassword(currentPassword);
    if (!isMatch) throw new BadRequestError('Current password is incorrect');

    userWithPassword.password = newPassword;
    await userWithPassword.save();

    await this.sessionService.revokeAllUserSessions(userId);
  }

  async googleLogin(
    profile: any,
    deviceInfo?: { userAgent: string; ip: string; platform: string; browser: string }
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const email = profile.emails?.[0]?.value;
    let user = await this.userRepo.findByGoogleId(profile.id);

    if (!user && email) {
      user = await this.userRepo.findByEmail(email);
      if (user) {
        user.googleId = profile.id;
        if (!user.isEmailVerified) {
          user.isEmailVerified = true;
          user.emailVerifiedAt = new Date();
        }
        if (profile.photos?.[0]?.value) {
          user.avatar = profile.photos[0].value;
        }
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
        emailVerifiedAt: new Date(),
        avatar: profile.photos?.[0]?.value,
        loginAttempts: 0,
      } as any);
    }

    const tokens = this.generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId: uuidv4(),
    });

    await this.sessionService.createSession(
      user._id.toString(),
      tokens.refreshToken,
      {
        userAgent: deviceInfo?.userAgent || '',
        ip: deviceInfo?.ip || '',
        platform: deviceInfo?.platform || '',
        browser: deviceInfo?.browser || '',
      }
    );

    return { user: user.toJSON() as unknown as IUser, ...tokens };
  }

  async getSessions(userId: string) {
    return this.sessionService.getUserSessions(userId);
  }

  async terminateSession(userId: string, sessionId: string): Promise<void> {
    await this.sessionService.terminateSession(sessionId, userId);
  }

  async getLoginHistory(userId: string, page = 1, limit = 20) {
    return this.sessionService.getLoginHistory(userId, page, limit);
  }

  async getBackupCodes(userId: string): Promise<string[]> {
    const user = await User.findById(userId).select('+backupCodes');
    if (!user) throw new BadRequestError('User not found');
    return user.backupCodes || [];
  }

  private async recordLoginAttempt(
    userId: string | null,
    email: string,
    method: LoginMethod,
    status: LoginStatus,
    deviceInfo?: { userAgent?: string; ip?: string; platform?: string; browser?: string },
    reason?: string
  ): Promise<void> {
    try {
      await LoginHistory.create({
        user: userId,
        method,
        status,
        ip: deviceInfo?.ip || '',
        userAgent: deviceInfo?.userAgent || '',
        device: deviceInfo?.platform || '',
        reason,
      });
    } catch (err) {
      logger.error('Failed to record login history', err);
    }
  }
}
