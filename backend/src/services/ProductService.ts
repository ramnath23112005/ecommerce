import { ProductRepository } from '../repositories/ProductRepository';
import Product from '../models/Product';
import { NotFoundError, BadRequestError } from '../utils/AppError';
import { IProduct } from '../../../shared/types';
import { ProductStatus } from '../../../shared/enums';
import { cacheData, getCachedData, invalidateCache } from '../config/redis';
import { parseQueryFilters } from '../utils/helpers';

export class ProductService {
  private productRepo: ProductRepository;

  constructor() {
    this.productRepo = new ProductRepository();
  }

  async getAll(query: Record<string, any>): Promise<{
    data: IProduct[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = parseInt(query.page as string) || 1;
    const limit = Math.min(parseInt(query.limit as string) || 20, 100);
    const filters = parseQueryFilters(query);

    const cacheKey = `products:${JSON.stringify({ page, limit, filters })}`;
    const cached = await getCachedData<{ data: IProduct[]; total: number }>(cacheKey);
    if (cached) {
      const totalPages = Math.ceil(cached.total / limit);
      return { ...cached, page, limit, totalPages };
    }

    const result = await this.productRepo.findWithPagination(
      { status: ProductStatus.ACTIVE, ...filters },
      { page, limit, sort: { createdAt: -1 }, populate: 'category' }
    );

    await cacheData(cacheKey, { data: result.data, total: result.total }, 300);
    return result as any;
  }

  async getBySlug(slug: string): Promise<IProduct> {
    const product = await this.productRepo.findBySlug(slug);
    if (!product) throw new NotFoundError('Product not found');
    return product;
  }

  async getById(id: string): Promise<IProduct> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundError('Product not found');
    return product;
  }

  async create(data: Partial<IProduct>, sellerId: string): Promise<IProduct> {
    const product = await this.productRepo.create({
      ...data,
      seller: sellerId,
    } as any);
    await invalidateCache('products:*');
    return product;
  }

  async update(id: string, data: Partial<IProduct>, userId: string): Promise<IProduct> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundError('Product not found');
    if (product.seller.toString() !== userId && (product.seller as any).role !== 'admin') {
      throw new BadRequestError('Not authorized to update this product');
    }

    const updated = await this.productRepo.update(id, data as any);
    if (!updated) throw new NotFoundError('Product not found');

    await invalidateCache('products:*');
    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundError('Product not found');
    if (product.seller.toString() !== userId && (product.seller as any).role !== 'admin') {
      throw new BadRequestError('Not authorized to delete this product');
    }

    await this.productRepo.delete(id);
    await invalidateCache('products:*');
  }

  async search(query: string, filters: Record<string, any> = {}): Promise<{
    data: IProduct[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = parseInt(filters.page as string) || 1;
    const limit = Math.min(parseInt(filters.limit as string) || 20, 100);
    const result = await this.productRepo.search(query, filters, page, limit);
    return result as any;
  }

  async getByCategory(categoryId: string, page = 1, limit = 20): Promise<{
    data: IProduct[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.productRepo.findByCategory(categoryId, page, limit) as any;
  }

  async getBySeller(sellerId: string, page = 1, limit = 20): Promise<{
    data: IProduct[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.productRepo.findBySeller(sellerId, page, limit) as any;
  }

  async getTopRated(limit = 10): Promise<IProduct[]> {
    const cached = await getCachedData<IProduct[]>('products:topRated');
    if (cached) return cached;

    const products = await this.productRepo.getTopRated(limit);
    await cacheData('products:topRated', products, 600);
    return products;
  }

  async getFeatured(): Promise<IProduct[]> {
    const cached = await getCachedData<IProduct[]>('products:featured');
    if (cached) return cached;

    const products = await this.productRepo.getFeatured();
    await cacheData('products:featured', products, 600);
    return products;
  }

  async updateStock(variantId: string, quantity: number): Promise<void> {
    await this.productRepo.updateStock(variantId, quantity);
    await invalidateCache('products:*');
  }

  async updateRating(productId: string): Promise<void> {
    const stats = await Product.aggregate([
      { $match: { _id: productId } },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'product',
          as: 'reviews',
        },
      },
      {
        $project: {
          averageRating: { $avg: '$reviews.rating' },
          numReviews: { $size: '$reviews' },
        },
      },
    ]);

    if (stats.length > 0) {
      await this.productRepo.update(productId, {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        numReviews: stats[0].numReviews,
      } as any);
    }
  }
}
