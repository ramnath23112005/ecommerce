import { Router } from 'express';
import {
  getSellersForAdmin, approveSeller, rejectSeller, suspendSeller, reinstateSeller,
  getCommissionRules, createCommissionRule,
} from '../controllers/SellerController';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/enums';

const router = Router();

router.use(protect);
router.use(authorize(UserRole.ADMIN));

// Seller management
router.get('/sellers', getSellersForAdmin);
router.put('/sellers/:id/approve', approveSeller);
router.put('/sellers/:id/reject', rejectSeller);
router.put('/sellers/:id/suspend', suspendSeller);
router.put('/sellers/:id/reinstate', reinstateSeller);

// Commission rules
router.get('/commissions', getCommissionRules);
router.post('/commissions', createCommissionRule);

export default router;
