import { Router } from 'express';
import { createPaymentIntent, verifyRazorpayPayment, handleStripeWebhook } from '../controllers/PaymentController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/stripe/webhook', handleStripeWebhook);

router.use(protect);

router.post('/create-intent', createPaymentIntent);
router.post('/razorpay/verify', verifyRazorpayPayment);

export default router;
