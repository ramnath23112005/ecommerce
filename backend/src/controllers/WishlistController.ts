import { Response, NextFunction } from 'express';
import { WishlistService } from '../services/WishlistService';
import { AuthRequest } from '../middleware/auth';
import { IAPIResponse } from '../../../shared/types';

const wishlistService = new WishlistService();

export const getWishlist = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const wishlist = await wishlistService.getWishlist(req.user._id.toString());
    res.json({ success: true, data: wishlist });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { productId } = req.body;
    const wishlist = await wishlistService.addProduct(req.user._id.toString(), productId);
    res.json({ success: true, data: wishlist });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const wishlist = await wishlistService.removeProduct(req.user._id.toString(), req.params.productId);
    res.json({ success: true, data: wishlist });
  } catch (error) {
    next(error);
  }
};
