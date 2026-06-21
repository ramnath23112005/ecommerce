import Order from '../models/Order';
import logger from '../utils/logger';

export class RecommendationService {
  async getRecommendedProducts(userId: string, limit = 10): Promise<string[]> {
    const recentOrders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('items.product');

    const categoryCount = new Map<string, number>();
    const sellerCount = new Map<string, number>();

    for (const order of recentOrders) {
      for (const item of order.items) {
        const product = item.product as any;
        if (product?.category) {
          categoryCount.set(product.category, (categoryCount.get(product.category) || 0) + 1);
        }
        if (product?.seller) {
          const sellerId = typeof product.seller === 'string' ? product.seller : product.seller._id;
          sellerCount.set(sellerId, (sellerCount.get(sellerId) || 0) + 1);
        }
      }
    }

    const preferredCategories = [...categoryCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);
    const preferredSellers = [...sellerCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => s);

    const orderProductIds = recentOrders.flatMap((o) => o.items.map((i) => (i.product as any)._id));
    const purchasedSet = new Set(orderProductIds.map((id) => id.toString()));

    const recommendations = await this.getProductsByPreferences(preferredCategories, preferredSellers, purchasedSet, limit);
    return recommendations;
  }

  private async getProductsByPreferences(
    categories: string[], sellers: string[], excludeIds: Set<string>, limit: number
  ): Promise<string[]> {
    const pipeline: any[] = [];
    const match: any = { status: 'active' };

    if (excludeIds.size > 0) {
      match._id = { $nin: [...excludeIds].map((id) => id as any) };
    }

    const should: any[] = [];
    if (categories.length > 0) should.push({ category: { $in: categories } });
    if (sellers.length > 0) should.push({ seller: { $in: sellers } });

    if (should.length > 0) {
      pipeline.push({ $match: { ...match, $or: should } });
    } else {
      pipeline.push({ $match: match });
    }

    pipeline.push(
      { $addFields: { relevanceScore: { $add: [{ $multiply: ['$averageRating', 2] }, { $divide: ['$numReviews', 10] }] } } },
      { $sort: { relevanceScore: -1 } },
      { $limit: limit },
      { $project: { _id: 1 } }
    );

    const results = await Order.aggregate(pipeline); // using Order as db driver
    return results.map((r) => r._id.toString());
  }

  async getTrendingProducts(limit = 10): Promise<string[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const trending = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, orderStatus: { $nin: ['cancelled', 'returned'] } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
    ]);
    return trending.map((t) => t._id.toString());
  }

  async getSimilarProducts(productId: string, limit = 6): Promise<string[]> {
    const product = await (await import('../models/Product')).default.findById(productId).lean();
    if (!product) return [];

    const similar = await (await import('../models/Product')).default.aggregate([
      {
        $match: {
          _id: { $ne: product._id as any },
          status: 'active',
          $or: [
            { category: product.category },
            { tags: { $in: product.tags || [] } },
          ],
        },
      },
      {
        $addFields: {
          commonTags: { $size: { $ifNull: [{ $setIntersection: ['$tags', product.tags || []] }, []] } },
        },
      },
      { $sort: { commonTags: -1, averageRating: -1 } },
      { $limit: limit },
      { $project: { _id: 1 } },
    ]);

    return similar.map((s) => s._id.toString());
  }
}

export const recommendationService = new RecommendationService();
