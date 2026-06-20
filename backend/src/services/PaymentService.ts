import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { config } from '../config';
import { PaymentMethod, PaymentStatus } from '../../../shared/enums';
import { BadRequestError } from '../utils/AppError';
import Payment from '../models/Payment';
import Order from '../models/Order';
import logger from '../utils/logger';

export class PaymentService {
  private stripe: Stripe | null;
  private razorpay: Razorpay | null;

  constructor() {
    this.stripe = config.stripe.secretKey ? new Stripe(config.stripe.secretKey, { apiVersion: '2024-11-20.acacia' }) : null;
    this.razorpay = config.razorpay.keyId && config.razorpay.keySecret
      ? new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret })
      : null;
  }

  async createStripePaymentIntent(orderId: string, amount: number, currency: string = 'usd'): Promise<Stripe.PaymentIntent> {
    if (!this.stripe) throw new BadRequestError('Stripe not configured');

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: { orderId },
    });

    await Payment.create({
      order: orderId,
      method: PaymentMethod.STRIPE,
      amount,
      currency,
      status: PaymentStatus.PROCESSING,
      transactionId: paymentIntent.id,
      gatewayResponse: paymentIntent,
    });

    return paymentIntent;
  }

  async handleStripeWebhook(payload: any, signature: string): Promise<void> {
    if (!this.stripe) throw new BadRequestError('Stripe not configured');

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, config.stripe.webhookSecret);
    } catch (err) {
      throw new BadRequestError('Invalid webhook signature');
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: PaymentStatus.SUCCEEDED,
          orderStatus: 'confirmed',
          paymentDetails: { stripePaymentIntentId: paymentIntent.id },
        });

        await Payment.findOneAndUpdate(
          { transactionId: paymentIntent.id },
          { status: PaymentStatus.SUCCEEDED }
        );

        logger.info(`Payment succeeded for order ${orderId}`);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: PaymentStatus.FAILED,
        });

        await Payment.findOneAndUpdate(
          { transactionId: paymentIntent.id },
          { status: PaymentStatus.FAILED }
        );

        logger.error(`Payment failed for order ${orderId}`);
        break;
      }
    }
  }

  async createRazorpayOrder(orderId: string, amount: number, currency: string = 'INR'): Promise<any> {
    if (!this.razorpay) throw new BadRequestError('Razorpay not configured');

    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: orderId,
      notes: { orderId },
    };

    const razorpayOrder = await this.razorpay.orders.create(options);

    await Payment.create({
      order: orderId,
      method: PaymentMethod.RAZORPAY,
      amount,
      currency,
      status: PaymentStatus.PROCESSING,
      transactionId: razorpayOrder.id,
      gatewayResponse: razorpayOrder,
    });

    return razorpayOrder;
  }

  async verifyRazorpayPayment(orderId: string, razorpayPaymentId: string, razorpayOrderId: string, signature: string): Promise<boolean> {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new BadRequestError('Invalid payment signature');
    }

    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: PaymentStatus.SUCCEEDED,
      orderStatus: 'confirmed',
      paymentDetails: { razorpayPaymentId, razorpayOrderId },
    });

    await Payment.findOneAndUpdate(
      { transactionId: razorpayOrderId },
      { status: PaymentStatus.SUCCEEDED, transactionId: razorpayPaymentId }
    );

    return true;
  }

  async processRefund(orderId: string): Promise<void> {
    const order = await Order.findById(orderId);
    if (!order) throw new BadRequestError('Order not found');

    const payment = await Payment.findOne({ order: orderId, status: PaymentStatus.SUCCEEDED });
    if (!payment) throw new BadRequestError('No successful payment found');

    if (payment.method === PaymentMethod.STRIPE && this.stripe) {
      await this.stripe.refunds.create({ payment_intent: payment.transactionId });
    }

    await Order.findByIdAndUpdate(orderId, { paymentStatus: PaymentStatus.REFUNDED, orderStatus: 'refunded' });
    await Payment.findByIdAndUpdate(payment._id, { status: PaymentStatus.REFUNDED });
  }
}
