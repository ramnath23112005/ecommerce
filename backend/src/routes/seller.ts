import { Router } from 'express';
import { getSellerAnalytics } from '../controllers/AnalyticsController';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/enums';

const router = Router();

router.use(protect);
router.use(authorize(UserRole.SELLER, UserRole.ADMIN));

router.get('/analytics', getSellerAnalytics);

export default router;
