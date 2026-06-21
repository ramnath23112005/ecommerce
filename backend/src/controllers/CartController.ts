import { Response, NextFunction } from 'express';
import { CartService } from '../services/CartService';
import { AuthRequest } from '../middleware/auth';
import { IAPIResponse } from '../../../shared/types';

const cartService = new CartService();

export const getCart = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const cart = await cartService.getCart(req.user._id.toString());
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { productId, variantId, quantity } = req.body;
    const cart = await cartService.addItem(req.user._id.toString(), productId, variantId, quantity);
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { variantId } = req.params;
    const { quantity } = req.body;
    const cart = await cartService.updateItem(req.user._id.toString(), variantId, quantity);
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { variantId } = req.params;
    const cart = await cartService.removeItem(req.user._id.toString(), variantId);
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    await cartService.clearCart(req.user._id.toString());
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};

export const applyCoupon = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { code } = req.body;
    const cart = await cartService.applyCoupon(req.user._id.toString(), code);
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

export const removeCoupon = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const cart = await cartService.removeCoupon(req.user._id.toString());
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};
