import crypto from 'crypto';

export enum EventTypes {
  USER_REGISTERED = 'user.registered',
  USER_EMAIL_VERIFIED = 'user.email_verified',
  USER_PASSWORD_CHANGED = 'user.password_changed',
  USER_LOCKED = 'user.locked',
  SUSPICIOUS_LOGIN = 'user.suspicious_login',

  ORDER_PLACED = 'order.placed',
  ORDER_CONFIRMED = 'order.confirmed',
  ORDER_PROCESSING = 'order.processing',
  ORDER_SHIPPED = 'order.shipped',
  ORDER_DELIVERED = 'order.delivered',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_REFUNDED = 'order.refunded',

  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  SELLER_APPLIED = 'seller.applied',
  SELLER_APPROVED = 'seller.approved',
  SELLER_REJECTED = 'seller.rejected',
  SELLER_SUSPENDED = 'seller.suspended',

  INVENTORY_LOW_STOCK = 'inventory.low_stock',
  INVENTORY_OUT_OF_STOCK = 'inventory.out_of_stock',
  INVENTORY_TRANSFER_COMPLETED = 'inventory.transfer_completed',
}

export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly timestamp: Date;
  public abstract readonly type: string;

  constructor() {
    this.eventId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

// --- Concrete Events ---

export class UserRegisteredEvent extends DomainEvent {
  readonly type = EventTypes.USER_REGISTERED;
  constructor(public readonly userId: string, public readonly email: string, public readonly name: string) {
    super();
  }
}

export class SuspiciousLoginEvent extends DomainEvent {
  readonly type = EventTypes.SUSPICIOUS_LOGIN;
  constructor(public readonly userId: string, public readonly email: string, public readonly ip: string, public readonly device: string) {
    super();
  }
}

export class OrderPlacedEvent extends DomainEvent {
  readonly type = EventTypes.ORDER_PLACED;
  constructor(public readonly orderId: string, public readonly orderNumber: string, public readonly userId: string, public readonly total: number) {
    super();
  }
}

export class OrderShippedEvent extends DomainEvent {
  readonly type = EventTypes.ORDER_SHIPPED;
  constructor(public readonly orderId: string, public readonly orderNumber: string, public readonly trackingNumber: string) {
    super();
  }
}

export class PaymentSucceededEvent extends DomainEvent {
  readonly type = EventTypes.PAYMENT_SUCCEEDED;
  constructor(public readonly paymentId: string, public readonly orderId: string, public readonly amount: number, public readonly method: string) {
    super();
  }
}

export class SellerApprovedEvent extends DomainEvent {
  readonly type = EventTypes.SELLER_APPROVED;
  constructor(public readonly sellerId: string, public readonly userId: string, public readonly storeName: string, public readonly contactEmail: string) {
    super();
  }
}

export class LowStockEvent extends DomainEvent {
  readonly type = EventTypes.INVENTORY_LOW_STOCK;
  constructor(public readonly productId: string, public readonly variantId: string, public readonly warehouseId: string, public readonly availableQuantity: number, public readonly threshold: number) {
    super();
  }
}
