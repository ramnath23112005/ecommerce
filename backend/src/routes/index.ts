import { Router } from 'express';
import authRoutes from './auth';
import productRoutes from './products';
import orderRoutes from './orders';
import cartRoutes from './cart';
import reviewRoutes from './reviews';
import wishlistRoutes from './wishlist';
import couponRoutes from './coupons';
import paymentRoutes from './payments';
import categoryRoutes from './categories';
import adminRoutes from './admin';
import sellerRoutes from './seller';
import uploadRoutes from './upload';
import { API_PREFIX } from '../../../shared/constants';

const router = Router();

router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/products`, productRoutes);
router.use(`${API_PREFIX}/orders`, orderRoutes);
router.use(`${API_PREFIX}/cart`, cartRoutes);
router.use(`${API_PREFIX}/products/:productId/reviews`, reviewRoutes);
router.use(`${API_PREFIX}/wishlist`, wishlistRoutes);
router.use(`${API_PREFIX}/coupons`, couponRoutes);
router.use(`${API_PREFIX}/payments`, paymentRoutes);
router.use(`${API_PREFIX}/categories`, categoryRoutes);
router.use(`${API_PREFIX}/admin`, adminRoutes);
router.use(`${API_PREFIX}/seller`, sellerRoutes);
router.use(`${API_PREFIX}/upload`, uploadRoutes);

export default router;
