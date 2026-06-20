import { Router } from 'express';
import { getAllUsers, updateUserRole, deleteUser, getDashboardStats } from '../controllers/AdminController';
import { getAdminAnalytics } from '../controllers/AnalyticsController';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '../../shared/enums';

const router = Router();

router.use(protect);
router.use(authorize(UserRole.ADMIN));

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAdminAnalytics);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

export default router;
