import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/ReviewService';
import { AuthRequest } from '../middleware/auth';
import { IAPIResponse } from '../../shared/types';

const reviewService = new ReviewService();

export const getProductReviews = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await reviewService.getByProduct(req.params.productId, page, limit);
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

export const createReview = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const review = await reviewService.create(req.user._id.toString(), req.params.productId, req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const review = await reviewService.update(req.params.id, req.user._id.toString(), req.body);
    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    await reviewService.delete(req.params.id, req.user._id.toString());
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};
