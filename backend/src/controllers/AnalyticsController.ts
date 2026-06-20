import { Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { AuthRequest } from '../middleware/auth';
import { IAPIResponse } from '../../../shared/types';

const analyticsService = new AnalyticsService();

export const getAdminAnalytics = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const analytics = await analyticsService.getAdminAnalytics(startDate, endDate);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

export const getSellerAnalytics = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const analytics = await analyticsService.getSellerAnalytics(req.user._id.toString(), startDate, endDate);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};
