export enum UserRole {
  ADMIN = 'admin',
  SELLER = 'seller',
  CUSTOMER = 'customer',
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  STRIPE = 'stripe',
  RAZORPAY = 'razorpay',
  COD = 'cod',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum CacheKeys {
  PRODUCTS = 'products',
  CATEGORIES = 'categories',
  CART = 'cart',
  USER = 'user',
  ORDERS = 'orders',
}

export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export enum LoginMethod {
  EMAIL = 'email',
  GOOGLE = 'google',
}

export enum LoginStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  SUSPICIOUS = 'suspicious',
  BLOCKED = 'blocked',
}

export enum TwoFactorMethod {
  TOTP = 'totp',
  EMAIL = 'email',
}

export enum SellerStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

export enum CommissionType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PayoutMethod {
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
}

export enum WarehouseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

export enum TransferStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum ReservationStatus {
  ACTIVE = 'active',
  CONFIRMED = 'confirmed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum InventoryChangeType {
  RECEIVED = 'received',
  TRANSFERRED_IN = 'transferred_in',
  TRANSFERRED_OUT = 'transferred_out',
  SOLD = 'sold',
  RETURNED = 'returned',
  ADJUSTMENT = 'adjustment',
  DAMAGED = 'damaged',
  RESERVED = 'reserved',
  RESERVATION_CANCELLED = 'reservation_cancelled',
}

export enum VerificationType {
  EMAIL_VERIFY = 'email_verify',
  PASSWORD_RESET = 'password_reset',
  TWO_FACTOR = 'two_factor',
  PHONE_VERIFY = 'phone_verify',
}
