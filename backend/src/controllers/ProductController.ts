import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/ProductService';
import { AuthRequest } from '../middleware/auth';
import { IAPIResponse } from '../../shared/types';

const productService = new ProductService();

export const getAllProducts = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const result = await productService.getAll(req.query);
    const totalPages = Math.ceil(result.total / result.limit);
    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages,
        hasNextPage: result.page < totalPages,
        hasPrevPage: result.page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const product = await productService.getBySlug(req.params.slug);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const product = await productService.getById(req.params.id);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const product = await productService.create(req.body, req.user._id.toString());
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const product = await productService.update(req.params.id, req.body, req.user._id.toString());
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    await productService.delete(req.params.id, req.user._id.toString());
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

export const searchProducts = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const query = (req.query.q as string) || '';
    const result = await productService.search(query, req.query);
    const totalPages = Math.ceil(result.total / result.limit);
    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages,
        hasNextPage: result.page < totalPages,
        hasPrevPage: result.page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTopRated = async (_req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const products = await productService.getTopRated();
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

export const getFeatured = async (_req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const products = await productService.getFeatured();
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};
