import { UserRole, OrderStatus, PaymentMethod, PaymentStatus, ProductStatus } from './enums';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  googleId?: string;
  isEmailVerified: boolean;
  phone?: string;
  address?: IAddress;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | ICategory;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVariant {
  _id: string;
  sku: string;
  size?: string;
  color?: string;
  price: number;
  salePrice?: number;
  stock: number;
  images: string[];
  isActive: boolean;
}

export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string | ICategory;
  seller: string | IUser;
  brand?: string;
  variants: IVariant[];
  tags: string[];
  attributes: Record<string, string>;
  status: ProductStatus;
  averageRating: number;
  numReviews: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview {
  _id: string;
  product: string | IProduct;
  user: string | IUser;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItem {
  product: string | IProduct;
  variant: string | IVariant;
  quantity: number;
  price: number;
}

export interface ICart {
  _id: string;
  user: string | IUser;
  items: ICartItem[];
  totalAmount: number;
  totalItems: number;
  coupon?: string;
  discount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWishlist {
  _id: string;
  user: string | IUser;
  products: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem {
  product: string | IProduct;
  variant: string | IVariant;
  name: string;
  image: string;
  quantity: number;
  price: number;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  user: string | IUser;
  items: IOrderItem[];
  shippingAddress: IAddress;
  billingAddress: IAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDetails?: Record<string, any>;
  orderStatus: OrderStatus;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  couponCode?: string;
  total: number;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoupon {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  startsAt: Date;
  expiresAt: Date;
  applicableCategories?: string[];
  applicableProducts?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment {
  _id: string;
  order: string | IOrder;
  user: string | IUser;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transactionId: string;
  gatewayResponse: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnalytics {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  revenueByPeriod: { date: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { product: string; sales: number; revenue: number }[];
  salesByCategory: { category: string; sales: number }[];
}

export interface IAPIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  stack?: string;
  pagination?: IPagination;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IJWTPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface IEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  data?: Record<string, any>;
}

export interface ISearchQuery {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort?: string;
  page?: number;
  limit?: number;
  tags?: string[];
  attributes?: Record<string, string>;
}
