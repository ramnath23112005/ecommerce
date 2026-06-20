import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthRequest } from '../middleware/auth';
import { IAPIResponse } from '../../../shared/types';

const authService = new AuthService();

export const register = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register(name, email, password);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
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
    const tokens = await authService.refreshToken(token);
    res.json({ success: true, data: tokens });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    await authService.logout(req.user._id.toString());
    res.json({ success: true, message: 'Logged out successfully' });
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

export const googleAuthCallback = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.googleLogin(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${result.accessToken}&refreshToken=${result.refreshToken}`);
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
