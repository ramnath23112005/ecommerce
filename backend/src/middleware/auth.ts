import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from '../utils/AppError';
import User from '../models/User';
import { IJWTPayload } from '../../../shared/types';
import { UserRole } from '../../../shared/enums';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new UnauthorizedError('Not authenticated. Please log in.');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as IJWTPayload;
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new UnauthorizedError('User no longer exists.');
    }

    if (user.isLocked && user.lockUntil && user.lockUntil > new Date()) {
      throw new UnauthorizedError('Account is temporarily locked. Try again later.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError('You do not have permission to perform this action.');
    }
    next();
  };
};

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as IJWTPayload;
      req.user = await User.findById(decoded.id);
    }
  } catch {
    // silently fail - user is optional
  }
  next();
};
