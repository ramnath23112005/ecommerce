import { Router } from 'express';
import { getProductReviews, createReview, updateReview, deleteReview } from '../controllers/ReviewController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createReviewSchema } from '../utils/validators';

const router = Router({ mergeParams: true });

router.get('/', getProductReviews);
router.post('/', protect, validate(createReviewSchema), createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

export default router;
