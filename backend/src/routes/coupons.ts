import { Router } from 'express';
import { createCoupon, getAllCoupons, getCouponByCode, updateCoupon, deleteCoupon } from '../controllers/CouponController';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/enums';

const router = Router();

router.get('/code/:code', getCouponByCode);

router.use(protect);
router.use(authorize(UserRole.ADMIN));

router.get('/', getAllCoupons);
router.post('/', createCoupon);
router.put('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);

export default router;
