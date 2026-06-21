import { Response, NextFunction } from 'express';
import { analyticsService } from '../services/AnalyticsService';
import { AuthRequest } from '../middleware/auth';
import { IAPIResponse } from '../../../shared/types';

export const getAdminAnalytics = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;
    const analytics = await analyticsService.getExecutiveDashboard({ fromDate, toDate });
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

export const getSellerAnalytics = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;
    const sellerProfile = await (await import('../models/SellerProfile')).default.findOne({ user: req.user._id });
    const analytics = await analyticsService.getSellerAnalytics(sellerProfile?._id.toString() || '', { fromDate, toDate });
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};
