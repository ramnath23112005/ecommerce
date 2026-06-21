import Wishlist from '../models/Wishlist';
import { NotFoundError } from '../utils/AppError';
import { IWishlist } from '../../../shared/types';
import { cacheData, getCachedData, invalidateCache } from '../config/redis';

export class WishlistService {
  async getWishlist(userId: string): Promise<IWishlist> {
    const cacheKey = `wishlist:${userId}`;
    const cached = await getCachedData<IWishlist>(cacheKey);
    if (cached) return cached;

    let wishlist = await Wishlist.findOne({ user: userId }).populate('products', 'name slug averageRating variants price');
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    await cacheData(cacheKey, wishlist, 300);
    return wishlist;
  }

  async addProduct(userId: string, productId: string): Promise<IWishlist> {
    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [productId] });
    } else if (!wishlist.products.includes(productId as any)) {
      wishlist.products.push(productId as any);
      await wishlist.save();
    }

    await invalidateCache(`wishlist:${userId}`);
    return wishlist;
  }

  async removeProduct(userId: string, productId: string): Promise<IWishlist> {
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) throw new NotFoundError('Wishlist not found');

    wishlist.products = wishlist.products.filter((p) => p.toString() !== productId);
    await wishlist.save();

    await invalidateCache(`wishlist:${userId}`);
    return wishlist;
  }

  async clearWishlist(userId: string): Promise<void> {
    await Wishlist.findOneAndUpdate({ user: userId }, { products: [] });
    await invalidateCache(`wishlist:${userId}`);
  }
}
