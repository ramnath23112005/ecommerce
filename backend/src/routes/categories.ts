import { Router } from 'express';
import { getAllCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory } from '../controllers/CategoryController';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/enums';

const router = Router();

router.get('/', getAllCategories);
router.get('/:slug', getCategoryBySlug);

router.use(protect);
router.use(authorize(UserRole.ADMIN));

router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
