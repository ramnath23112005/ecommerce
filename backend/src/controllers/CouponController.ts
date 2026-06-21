import { Request, Response, NextFunction } from 'express';
import Coupon from '../models/Coupon';
import { AuthRequest } from '../middleware/auth';
import { IAPIResponse } from '../../../shared/types';
import { NotFoundError } from '../utils/AppError';

export const createCoupon = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

export const getAllCoupons = async (_req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
};

export const getCouponByCode = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase(), isActive: true });
    if (!coupon) throw new NotFoundError('Coupon not found');
    res.json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) throw new NotFoundError('Coupon not found');
    res.json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) throw new NotFoundError('Coupon not found');
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};
