export const API_PREFIX = '/api/v1';
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;
export const SALT_ROUNDS = 12;
export const JWT_EXPIRES_IN = '7d';
export const JWT_REFRESH_EXPIRES_IN = '30d';
export const OTP_EXPIRY_MINUTES = 10;
export const CACHE_TTL = 300;
export const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
export const RATE_LIMIT_MAX = 100;
export const UPLOAD_MAX_SIZE = 5 * 1024 * 1024;

export const ORDER_STATUS_FLOW: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['in_transit'],
  in_transit: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: ['returned'],
  cancelled: [],
  returned: ['refunded'],
  refunded: [],
};

export const ROLES = {
  ADMIN: 'admin',
  SELLER: 'seller',
  CUSTOMER: 'customer',
} as const;

export const COUPON_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
} as const;
