import Review from '../models/Review';
import Order from '../models/Order';
import { NotFoundError, BadRequestError } from '../utils/AppError';
import { IReview } from '../../shared/types';
import { ProductService } from './ProductService';

export class ReviewService {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  async getByProduct(productId: string, page = 1, limit = 20): Promise<{
    data: IReview[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Review.find({ product: productId })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Review.countDocuments({ product: productId }),
    ]);

    return { data, total, page, limit };
  }

  async create(userId: string, productId: string, data: {
    rating: number;
    title: string;
    comment: string;
    images?: string[];
  }): Promise<IReview> {
    const existing = await Review.findOne({ user: userId, product: productId });
    if (existing) {
      throw new BadRequestError('You have already reviewed this product');
    }

    const hasPurchased = await Order.findOne({
      user: userId,
      'items.product': productId,
      orderStatus: 'delivered',
    });

    const review = await Review.create({
      user: userId,
      product: productId,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      images: data.images || [],
      isVerifiedPurchase: !!hasPurchased,
    });

    await this.productService.updateRating(productId);
    return review;
  }

  async update(reviewId: string, userId: string, data: Partial<IReview>): Promise<IReview> {
    const review = await Review.findOne({ _id: reviewId, user: userId });
    if (!review) throw new NotFoundError('Review not found');

    Object.assign(review, data);
    await review.save();

    await this.productService.updateRating(review.product.toString());
    return review;
  }

  async delete(reviewId: string, userId: string): Promise<void> {
    const review = await Review.findOne({ _id: reviewId, user: userId });
    if (!review) throw new NotFoundError('Review not found');

    const productId = review.product.toString();
    await Review.findByIdAndDelete(reviewId);
    await this.productService.updateRating(productId);
  }
}
