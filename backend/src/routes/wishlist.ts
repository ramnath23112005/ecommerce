import { Router } from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/WishlistController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:productId', removeFromWishlist);

export default router;
