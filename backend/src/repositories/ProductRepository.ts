import { BaseRepository } from './BaseRepository';
import Product, { IProductDocument } from '../models/Product';

export class ProductRepository extends BaseRepository<IProductDocument> {
  constructor() {
    super(Product);
  }

  async findBySlug(slug: string): Promise<IProductDocument | null> {
    return this.model.findOne({ slug })
      .populate('category')
      .populate('seller', 'name email')
      .exec();
  }

  async findByCategory(categoryId: string, page = 1, limit = 20): Promise<{
    data: IProductDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.findWithPagination(
      { category: categoryId, status: 'active' },
      { page, limit, sort: { createdAt: -1 } }
    );
  }

  async findBySeller(sellerId: string, page = 1, limit = 20): Promise<{
    data: IProductDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.findWithPagination(
      { seller: sellerId },
      { page, limit, sort: { createdAt: -1 } }
    );
  }

  async search(
    query: string,
    filters: Record<string, any> = {},
    page = 1,
    limit = 20
  ): Promise<{
    data: IProductDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const searchQuery: any = { status: 'active', ...filters };

    if (query) {
      searchQuery.$text = { $search: query };
    }

    const sort = query ? { score: { $meta: 'textScore' } } : { createdAt: -1 };
    const projection = query ? { score: { $meta: 'textScore' } } : {};

    return this.findWithPagination(searchQuery, {
      page,
      limit,
      sort,
      select: projection as any,
      populate: 'category',
    });
  }

  async updateStock(variantId: string, quantity: number): Promise<void> {
    await this.model.updateOne(
      { 'variants._id': variantId },
      { $inc: { 'variants.$.stock': -quantity } }
    ).exec();
  }

  async getTopRated(limit = 10): Promise<IProductDocument[]> {
    return this.model.find({ status: 'active' })
      .sort({ averageRating: -1, numReviews: -1 })
      .limit(limit)
      .populate('category')
      .exec();
  }

  async getFeatured(): Promise<IProductDocument[]> {
    return this.model.find({ isFeatured: true, status: 'active' })
      .populate('category')
      .exec();
  }
}
