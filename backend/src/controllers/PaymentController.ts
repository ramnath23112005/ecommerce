import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/PaymentService';
import { AuthRequest } from '../middleware/auth';
import { IAPIResponse } from '../../shared/types';
import Order from '../models/Order';

const paymentService = new PaymentService();

export const createPaymentIntent = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { orderId, method } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (method === 'stripe') {
      const paymentIntent = await paymentService.createStripePaymentIntent(orderId, order.total);
      res.json({ success: true, data: { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id } });
    } else if (method === 'razorpay') {
      const razorpayOrder = await paymentService.createRazorpayOrder(orderId, order.total);
      res.json({ success: true, data: { orderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency } });
    } else {
      res.status(400).json({ success: false, message: 'Invalid payment method' });
    }
  } catch (error) {
    next(error);
  }
};

export const verifyRazorpayPayment = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, signature } = req.body;
    await paymentService.verifyRazorpayPayment(orderId, razorpayPaymentId, razorpayOrderId, signature);
    res.json({ success: true, message: 'Payment verified' });
  } catch (error) {
    next(error);
  }
};

export const handleStripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    await paymentService.handleStripeWebhook(req.body, signature);
    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};
