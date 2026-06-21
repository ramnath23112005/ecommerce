import { Router } from 'express';
import { createOrder, getOrderById, getMyOrders, cancelOrder, updateOrderStatus, getAllOrders } from '../controllers/OrderController';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrderSchema } from '../utils/validators';
import { UserRole } from '../../../shared/enums';

const router = Router();

router.use(protect);

router.get('/my-orders', getMyOrders);
router.post('/', validate(createOrderSchema), createOrder);
router.get('/all', authorize(UserRole.ADMIN, UserRole.SELLER), getAllOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);
router.put('/:id/status', authorize(UserRole.ADMIN, UserRole.SELLER), updateOrderStatus);

export default router;
