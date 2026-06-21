import { Router } from 'express';
import { getAllProducts, getProductBySlug, getProductById, createProduct, updateProduct, deleteProduct, searchProducts, getTopRated, getFeatured } from '../controllers/ProductController';
import { protect, authorize, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createProductSchema } from '../utils/validators';
import { UserRole } from '../../../shared/enums';

const router = Router();

router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/top-rated', getTopRated);
router.get('/featured', getFeatured);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);

router.use(protect);
router.post('/', authorize(UserRole.SELLER, UserRole.ADMIN), validate(createProductSchema), createProduct);
router.put('/:id', authorize(UserRole.SELLER, UserRole.ADMIN), updateProduct);
router.delete('/:id', authorize(UserRole.SELLER, UserRole.ADMIN), deleteProduct);

export default router;
