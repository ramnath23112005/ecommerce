import { OrderRepository } from '../repositories/OrderRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import Product from '../models/Product';
import Coupon from '../models/Coupon';
import { NotFoundError, BadRequestError } from '../utils/AppError';
import { IOrder, IOrderItem } from '../../shared/types';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../shared/enums';
import { generateOrderNumber } from '../utils/helpers';
import { sendOrderConfirmationEmail } from '../utils/email';

export class OrderService {
  private orderRepo: OrderRepository;

  constructor() {
    this.orderRepo = new OrderRepository();
  }

  async create(
    userId: string,
    items: Array<{ product: string; variant: string; quantity: number }>,
    shippingAddress: any,
    billingAddress: any,
    paymentMethod: PaymentMethod,
    couponCode?: string
  ): Promise<IOrder> {
    let discount = 0;
    let coupon: any = null;

    const orderItems: IOrderItem[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product).populate('category');
      if (!product) throw new NotFoundError(`Product ${item.product} not found`);
      if (product.status !== 'active') throw new BadRequestError(`${product.name} is not available`);

      const variant = product.variants.find((v: any) => v._id.toString() === item.variant);
      if (!variant) throw new NotFoundError(`Variant not found for ${product.name}`);
      if (variant.stock < item.quantity) throw new BadRequestError(`Insufficient stock for ${product.name} - ${variant.size || variant.color || ''}`);

      const price = variant.salePrice || variant.price;
      subtotal += price * item.quantity;

      orderItems.push({
        product: product._id as any,
        variant: variant._id as any,
        name: product.name,
        image: variant.images[0] || '',
        quantity: item.quantity,
        price,
      });
    }

    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        expiresAt: { $gt: new Date() },
        startsAt: { $lt: new Date() },
      });

      if (!coupon) throw new BadRequestError('Invalid or expired coupon');
      if (coupon.usedCount >= coupon.usageLimit) throw new BadRequestError('Coupon usage limit reached');
      if (subtotal < coupon.minOrderAmount) throw new BadRequestError(`Minimum order amount of ₹${coupon.minOrderAmount} required`);

      discount = coupon.discountType === 'percentage'
        ? Math.min(subtotal * (coupon.discountValue / 100), coupon.maxDiscount || Infinity)
        : coupon.discountValue;

      coupon.usedCount += 1;
      await coupon.save();
    }

    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const shippingCost = subtotal >= 500 ? 0 : 50;
    const total = Math.max(0, subtotal + tax + shippingCost - discount);

    const order = await this.orderRepo.create({
      orderNumber: generateOrderNumber(),
      user: userId as any,
      items: orderItems,
      shippingAddress,
      billingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === PaymentMethod.COD ? PaymentStatus.PENDING : PaymentStatus.PENDING,
      orderStatus: OrderStatus.PENDING,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      shippingCost,
      discount: Math.round(discount * 100) / 100,
      couponCode: couponCode?.toUpperCase(),
      total: Math.round(total * 100) / 100,
    } as any);

    for (const item of orderItems) {
      await this.updateStock(item.variant.toString(), item.quantity);
    }

    const user = await this.orderRepo.model.db.model('User').findById(userId);
    if (user) {
      await sendOrderConfirmationEmail(user.email, user.name, order.orderNumber, order.total);
    }

    return order;
  }

  async getById(orderId: string): Promise<IOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    return order;
  }

  async getByOrderNumber(orderNumber: string): Promise<IOrder> {
    const order = await this.orderRepo.findByOrderNumber(orderNumber);
    if (!order) throw new NotFoundError('Order not found');
    return order;
  }

  async getByUser(userId: string, page = 1, limit = 20): Promise<{
    data: IOrder[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.orderRepo.findByUser(userId, page, limit) as any;
  }

  async getBySeller(sellerId: string, page = 1, limit = 20): Promise<{
    data: IOrder[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.orderRepo.findBySeller(sellerId, page, limit) as any;
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<IOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');

    const allowedTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['in_transit'],
      in_transit: ['out_for_delivery'],
      out_for_delivery: ['delivered'],
      delivered: ['returned'],
      cancelled: [],
      returned: ['refunded'],
      refunded: [],
    };

    const allowed = allowedTransitions[order.orderStatus] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestError(`Cannot transition from ${order.orderStatus} to ${status}`);
    }

    const update: any = { orderStatus: status };
    if (status === OrderStatus.DELIVERED) {
      update.deliveredAt = new Date();
    }

    const updated = await this.orderRepo.update(orderId, update);
    if (!updated) throw new NotFoundError('Order not found');
    return updated;
  }

  async cancel(orderId: string, userId: string): Promise<IOrder> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (order.user.toString() !== userId) throw new BadRequestError('Not authorized');

    if (!['pending', 'confirmed'].includes(order.orderStatus)) {
      throw new BadRequestError('Order cannot be cancelled at this stage');
    }

    const updated = await this.orderRepo.update(orderId, { orderStatus: OrderStatus.CANCELLED } as any);
    if (!updated) throw new NotFoundError('Order not found');
    return updated;
  }

  async updatePaymentStatus(orderId: string, status: PaymentStatus, paymentDetails?: Record<string, any>): Promise<IOrder> {
    const update: any = { paymentStatus: status };
    if (paymentDetails) update.paymentDetails = paymentDetails;
    if (status === PaymentStatus.SUCCEEDED) {
      update.orderStatus = OrderStatus.CONFIRMED;
    }

    const order = await this.orderRepo.update(orderId, update);
    if (!order) throw new NotFoundError('Order not found');
    return order;
  }

  private async updateStock(variantId: string, quantity: number): Promise<void> {
    await Product.updateOne(
      { 'variants._id': variantId },
      { $inc: { 'variants.$.stock': -quantity } }
    );
  }
}
