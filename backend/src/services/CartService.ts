import Cart from '../models/Cart';
import Product from '../models/Product';
import Coupon from '../models/Coupon';
import { NotFoundError, BadRequestError } from '../utils/AppError';
import { ICart } from '../../../shared/types';
import { cacheData, getCachedData, invalidateCache } from '../config/redis';

export class CartService {
  async getCart(userId: string): Promise<ICart> {
    const cacheKey = `cart:${userId}`;
    const cached = await getCachedData<ICart>(cacheKey);
    if (cached) return cached;

    let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name slug status variants');
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [], totalAmount: 0, totalItems: 0 });
    }

    await cacheData(cacheKey, cart, 300);
    return cart;
  }

  async addItem(userId: string, productId: string, variantId: string, quantity: number): Promise<ICart> {
    const product = await Product.findById(productId);
    if (!product) throw new NotFoundError('Product not found');
    if (product.status !== 'active') throw new BadRequestError('Product is not available');

    const variant = product.variants.find((v: any) => v._id.toString() === variantId);
    if (!variant) throw new NotFoundError('Variant not found');
    if (variant.stock < quantity) throw new BadRequestError('Insufficient stock');

    const price = variant.salePrice || variant.price;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [], totalAmount: 0, totalItems: 0 });
    }

    const existingIndex = cart.items.findIndex(
      (i) => i.product.toString() === productId && i.variant.toString() === variantId
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId as any, variant: variantId as any, quantity, price });
    }

    await this.recalculateCart(cart);
    await cart.save();
    await invalidateCache(`cart:${userId}`);
    return cart;
  }

  async updateItem(userId: string, variantId: string, quantity: number): Promise<ICart> {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new NotFoundError('Cart not found');

    const item = cart.items.find((i) => i.variant.toString() === variantId);
    if (!item) throw new NotFoundError('Item not found in cart');

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.variant.toString() !== variantId);
    } else {
      item.quantity = quantity;
    }

    await this.recalculateCart(cart);
    await cart.save();
    await invalidateCache(`cart:${userId}`);
    return cart;
  }

  async removeItem(userId: string, variantId: string): Promise<ICart> {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new NotFoundError('Cart not found');

    cart.items = cart.items.filter((i) => i.variant.toString() !== variantId);
    await this.recalculateCart(cart);
    await cart.save();
    await invalidateCache(`cart:${userId}`);
    return cart;
  }

  async clearCart(userId: string): Promise<void> {
    await Cart.findOneAndUpdate({ user: userId }, { items: [], totalAmount: 0, totalItems: 0, coupon: null, discount: 0 });
    await invalidateCache(`cart:${userId}`);
  }

  async applyCoupon(userId: string, couponCode: string): Promise<ICart> {
    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) throw new BadRequestError('Cart is empty');

    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() },
      startsAt: { $lt: new Date() },
    });

    if (!coupon) throw new BadRequestError('Invalid or expired coupon');
    if (coupon.usedCount >= coupon.usageLimit) throw new BadRequestError('Coupon usage limit reached');

    let discount = coupon.discountType === 'percentage'
      ? Math.min(cart.totalAmount * (coupon.discountValue / 100), coupon.maxDiscount || Infinity)
      : coupon.discountValue;

    if (cart.totalAmount < coupon.minOrderAmount) {
      throw new BadRequestError(`Minimum order amount of ₹${coupon.minOrderAmount} required`);
    }

    cart.coupon = couponCode.toUpperCase();
    cart.discount = Math.round(discount * 100) / 100;
    await cart.save();
    await invalidateCache(`cart:${userId}`);
    return cart;
  }

  async removeCoupon(userId: string): Promise<ICart> {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new NotFoundError('Cart not found');

    cart.coupon = undefined;
    cart.discount = 0;
    await cart.save();
    await invalidateCache(`cart:${userId}`);
    return cart;
  }

  private async recalculateCart(cart: any): Promise<void> {
    cart.totalItems = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    cart.totalAmount = Math.round(cart.totalAmount * 100) / 100;
  }
}
