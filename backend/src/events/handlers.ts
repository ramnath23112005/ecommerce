import logger from '../utils/logger';
import { sendEmail } from '../utils/email';
import { eventBus } from './EventBus';
import {
  EventTypes, UserRegisteredEvent, SuspiciousLoginEvent,
  OrderPlacedEvent, OrderShippedEvent, PaymentSucceededEvent,
  SellerApprovedEvent, LowStockEvent,
} from './events';

export function registerEventHandlers(): void {
  eventBus.subscribe(EventTypes.USER_REGISTERED, async (event: UserRegisteredEvent) => {
    logger.info(`[EVENT] User registered: ${event.email}`);
  });

  eventBus.subscribe(EventTypes.SUSPICIOUS_LOGIN, async (event: SuspiciousLoginEvent) => {
    logger.warn(`[EVENT] Suspicious login detected for ${event.email} from ${event.ip}`);
    try {
      await sendEmail({
        to: event.email,
        subject: 'Suspicious login detected',
        html: `<h1>Suspicious Login</h1><p>We detected a login from ${event.device} at IP ${event.ip}.</p><p>If this was you, ignore this message. Otherwise, change your password immediately.</p>`,
      });
    } catch (err) {
      logger.error('Failed to send suspicious login alert email', err);
    }
  });

  eventBus.subscribe(EventTypes.ORDER_PLACED, async (event: OrderPlacedEvent) => {
    logger.info(`[EVENT] Order placed: ${event.orderNumber} by user ${event.userId}`);
  });

  eventBus.subscribe(EventTypes.ORDER_SHIPPED, async (event: OrderShippedEvent) => {
    logger.info(`[EVENT] Order shipped: ${event.orderNumber}, tracking: ${event.trackingNumber}`);
  });

  eventBus.subscribe(EventTypes.PAYMENT_SUCCEEDED, async (event: PaymentSucceededEvent) => {
    logger.info(`[EVENT] Payment succeeded: ${event.paymentId} for order ${event.orderId}, amount: ${event.amount}`);
  });

  eventBus.subscribe(EventTypes.SELLER_APPROVED, async (event: SellerApprovedEvent) => {
    logger.info(`[EVENT] Seller approved: ${event.storeName}`);
    try {
      await sendEmail({
        to: event.contactEmail,
        subject: 'Your seller account has been approved!',
        html: `<h1>Congratulations!</h1><p>Your seller account <strong>${event.storeName}</strong> has been approved. You can now start listing products.</p>`,
      });
    } catch (err) {
      logger.error('Failed to send seller approval email', err);
    }
  });

  eventBus.subscribe(EventTypes.INVENTORY_LOW_STOCK, async (event: LowStockEvent) => {
    logger.warn(`[EVENT] Low stock alert: product ${event.productId}, available: ${event.availableQuantity}, threshold: ${event.threshold}`);
  });

  logger.info('Event handlers registered');
}
