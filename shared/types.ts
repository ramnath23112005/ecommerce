import { UserRole, OrderStatus, PaymentMethod, PaymentStatus, ProductStatus, SessionStatus, LoginMethod, LoginStatus, TwoFactorMethod, VerificationType, SellerStatus, CommissionType, PayoutStatus, PayoutMethod, WarehouseStatus, TransferStatus, ReservationStatus, InventoryChangeType } from './enums';

export interface IUserSession {
  _id: string;
  user: string;
  refreshToken: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    platform: string;
    browser: string;
    location?: string;
  };
  status: SessionStatus;
  lastActivity: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoginHistory {
  _id: string;
  user: string;
  method: LoginMethod;
  status: LoginStatus;
  ip: string;
  userAgent: string;
  device: string;
  location?: string;
  reason?: string;
  createdAt: Date;
}

export interface IVerificationToken {
  _id: string;
  user: string;
  token: string;
  type: VerificationType;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

export interface IBackupCode {
  _id: string;
  user: string;
  code: string;
  usedAt?: Date;
  createdAt: Date;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  googleId?: string;
  isEmailVerified: boolean;
  emailVerifiedAt?: Date;
  phone?: string;
  phoneVerified: boolean;
  address?: IAddress;
  twoFactorEnabled: boolean;
  twoFactorMethod?: TwoFactorMethod;
  twoFactorSecret?: string;
  backupCodes: string[];
  isLocked: boolean;
  lockUntil?: Date;
  loginAttempts: number;
  lastLogin?: Date;
  lastLoginIp?: string;
  accountRestoredAt?: Date;
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
  sessionId?: string;
  jti?: string;
}

export interface IEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  data?: Record<string, any>;
}

export interface ISellerProfile {
  _id: string;
  user: string | IUser;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogo?: string;
  storeBanner?: string;
  contactEmail: string;
  contactPhone?: string;
  businessAddress?: IAddress;
  taxId?: string;
  businessRegistration?: string;
  status: SellerStatus;
  commissionRate: number;
  commissionType: CommissionType;
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  totalPayout: number;
  rating: number;
  numReviews: number;
  joinedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISellerPayout {
  _id: string;
  seller: string | ISellerProfile;
  amount: number;
  commission: number;
  netAmount: number;
  status: PayoutStatus;
  method: PayoutMethod;
  reference?: string;
  notes?: string;
  periodStart: Date;
  periodEnd: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISellerBankAccount {
  _id: string;
  seller: string | ISellerProfile;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  bankCode?: string;
  branchCode?: string;
  currency: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommission {
  _id: string;
  category?: string;
  seller?: string;
  rate: number;
  type: CommissionType;
  isGlobal: boolean;
  priority: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWarehouse {
  _id: string;
  name: string;
  code: string;
  address: IAddress;
  contactName: string;
  contactPhone: string;
  email: string;
  capacity: {
    maxItems: number;
    currentItems: number;
  };
  status: WarehouseStatus;
  isDefault: boolean;
  metadata: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryItem {
  _id: string;
  product: string | IProduct;
  variant: string | IVariant;
  warehouse: string | IWarehouse;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  reorderPoint: number;
  locationInWarehouse?: string;
  batchNumber?: string;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryTransfer {
  _id: string;
  fromWarehouse: string | IWarehouse;
  toWarehouse: string | IWarehouse;
  product: string | IProduct;
  variant: string | IVariant;
  quantity: number;
  status: TransferStatus;
  initiatedBy: string | IUser;
  approvedBy?: string | IUser;
  notes?: string;
  trackingReference?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryReservation {
  _id: string;
  product: string | IProduct;
  variant: string | IVariant;
  warehouse: string | IWarehouse;
  order?: string | IOrder;
  quantity: number;
  status: ReservationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryAuditLog {
  _id: string;
  product: string | IProduct;
  variant: string | IVariant;
  warehouse: string | IWarehouse;
  changeType: InventoryChangeType;
  quantityBefore: number;
  quantityAfter: number;
  quantityChange: number;
  reference?: string;
  performedBy?: string | IUser;
  notes?: string;
  createdAt: Date;
}

export interface IStorefront {
  _id: string;
  seller: string | ISellerProfile;
  theme: Record<string, string>;
  layout: string;
  customDomain?: string;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
