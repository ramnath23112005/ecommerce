import { Request, Response, NextFunction } from 'express';
import Category from '../models/Category';
import { NotFoundError } from '../utils/AppError';
import { IAPIResponse } from '../../../shared/types';
import { cacheData, getCachedData } from '../config/redis';

export const getAllCategories = async (_req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const cached = await getCachedData('categories');
    if (cached) return res.json({ success: true, data: cached });

    const categories = await Category.find({ isActive: true }).populate('parent', 'name slug').sort({ name: 1 });
    await cacheData('categories', categories, 600);
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true }).populate('parent', 'name slug');
    if (!category) throw new NotFoundError('Category not found');
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const category = await Category.create(req.body);
    await cacheData('categories', null, 1); // invalidate
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) throw new NotFoundError('Category not found');
    await cacheData('categories', null, 1);
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) throw new NotFoundError('Category not found');
    await cacheData('categories', null, 1);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};
