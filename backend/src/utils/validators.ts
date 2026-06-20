import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.string(),
  brand: z.string().optional(),
  variants: z.array(z.object({
    sku: z.string().optional(),
    size: z.string().optional(),
    color: z.string().optional(),
    price: z.number().min(0),
    salePrice: z.number().min(0).optional(),
    stock: z.number().min(0),
    images: z.array(z.string()).optional(),
  })).min(1),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'draft']).optional(),
});

export const createOrderSchema = z.object({
  items: z.array(z.object({
    product: z.string(),
    variant: z.string(),
    quantity: z.number().min(1),
  })).min(1),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().min(1),
  }),
  billingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().min(1),
  }),
  paymentMethod: z.enum(['stripe', 'razorpay', 'cod']),
  couponCode: z.string().optional(),
});

export const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(100),
  comment: z.string().min(1).max(1000),
  images: z.array(z.string()).optional(),
});

export const createCouponSchema = z.object({
  code: z.string().min(3).max(20),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(0),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().min(0).optional(),
  startsAt: z.string(),
  expiresAt: z.string(),
  applicableCategories: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
});
