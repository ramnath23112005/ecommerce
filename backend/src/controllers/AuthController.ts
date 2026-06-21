import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { TwoFactorService } from '../services/TwoFactorService';
import { AuthRequest } from '../middleware/auth';
import { IAPIResponse } from '../../../shared/types';

const authService = new AuthService();
const twoFactorService = new TwoFactorService();

const extractDeviceInfo = (req: Request) => ({
  userAgent: req.headers['user-agent'] || '',
  ip: req.ip || req.socket.remoteAddress || '',
  platform: (req.headers['sec-ch-ua-platform'] as string) || '',
  browser: (req.headers['sec-ch-ua'] as string) || '',
});

export const register = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register(name, email, password, extractDeviceInfo(req));
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password, extractDeviceInfo(req));
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { token } = req.params;
    await authService.verifyEmail(token);
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

export const resendVerificationEmail = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { email } = req.body;
    await authService.resendVerificationEmail(email);
    res.json({ success: true, message: 'Verification email sent if the account exists' });
  } catch (error) {
    next(error);
  }
};

export const verifyTwoFactor = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { userId, token } = req.body;
    const result = await authService.verifyTwoFactor(userId, token, extractDeviceInfo(req));
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }
    const tokens = await authService.refreshToken(token, {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.socket.remoteAddress || '',
    });
    res.json({ success: true, data: tokens });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const refreshTokenHeader = req.headers['x-refresh-token'] as string;
    await authService.logout(req.user._id.toString(), refreshTokenHeader);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const logoutAllDevices = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const currentToken = req.headers['x-refresh-token'] as string;
    await authService.logoutAllDevices(req.user._id.toString(), currentToken);
    res.json({ success: true, message: 'Logged out of all other devices' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    await authService.forgotPassword(req.body.email);
    res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    await authService.resetPassword(token, password);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user._id.toString(), currentPassword, newPassword);
    res.json({ success: true, message: 'Password changed successfully. Please login again.' });
  } catch (error) {
    next(error);
  }
};

export const googleAuthCallback = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || '',
      ip: req.ip || req.socket.remoteAddress || '',
      platform: (req.headers['sec-ch-ua-platform'] as string) || '',
      browser: (req.headers['sec-ch-ua'] as string) || '',
    };
    const result = await authService.googleLogin(req.user, deviceInfo);
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${result.accessToken}&refreshToken=${result.refreshToken}`
    );
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const user = req.user;
    const { name, phone, address } = req.body;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    await user.save();
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const sessions = await authService.getSessions(req.user._id.toString());
    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
};

export const terminateSession = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    await authService.terminateSession(req.user._id.toString(), sessionId);
    res.json({ success: true, message: 'Session terminated' });
  } catch (error) {
    next(error);
  }
};

export const getLoginHistory = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await authService.getLoginHistory(req.user._id.toString(), page, limit);
    const totalPages = Math.ceil(result.total / limit);
    res.json({
      success: true,
      data: result.data,
      pagination: { page, limit, total: result.total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
  } catch (error) {
    next(error);
  }
};

// 2FA Controllers

export const setupTwoFactor = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const user = req.user;
    const { secret, otpauth } = twoFactorService.generateSecret(user._id.toString(), user.email);
    await twoFactorService.saveSecret(user._id.toString(), secret);
    res.json({
      success: true,
      data: { secret, otpauth },
    });
  } catch (error) {
    next(error);
  }
};

export const enableTwoFactor = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { token, method } = req.body;
    await twoFactorService.enableTwoFactor(req.user._id.toString(), token, method);
    res.json({ success: true, message: 'Two-factor authentication enabled' });
  } catch (error) {
    next(error);
  }
};

export const disableTwoFactor = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { password } = req.body;
    await twoFactorService.disableTwoFactor(req.user._id.toString(), password);
    res.json({ success: true, message: 'Two-factor authentication disabled' });
  } catch (error) {
    next(error);
  }
};

export const getBackupCodes = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const remaining = await twoFactorService.getRemainingBackupCodes(req.user._id.toString());
    const codes = remaining === 0
      ? await twoFactorService.generateBackupCodes(req.user._id.toString())
      : [];
    res.json({ success: true, data: { codes, remaining } });
  } catch (error) {
    next(error);
  }
};
