import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/OrderService';
import { AuthRequest } from '../middleware/auth';
import { IAPIResponse } from '../../../shared/types';

const orderService = new OrderService();

export const createOrder = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { items, shippingAddress, billingAddress, paymentMethod, couponCode } = req.body;
    const order = await orderService.create(
      req.user._id.toString(),
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      couponCode
    );
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const order = await orderService.getById(req.params.id);
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await orderService.getByUser(req.user._id.toString(), page, limit);
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

export const cancelOrder = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const order = await orderService.cancel(req.params.id, req.user._id.toString());
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const order = await orderService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    let result;
    if (req.user.role === 'seller') {
      result = await orderService.getBySeller(req.user._id.toString(), page, limit);
    } else {
      const { OrderRepository } = require('../repositories/OrderRepository');
      const orderRepo = new OrderRepository();
      result = await orderRepo.findWithPagination({}, { page, limit, sort: { createdAt: -1 }, populate: 'user' });
    }

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
