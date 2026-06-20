import { BaseRepository } from './BaseRepository';
import Order, { IOrderDocument } from '../models/Order';

export class OrderRepository extends BaseRepository<IOrderDocument> {
  constructor() {
    super(Order);
  }

  async findByOrderNumber(orderNumber: string): Promise<IOrderDocument | null> {
    return this.model.findOne({ orderNumber })
      .populate('user', 'name email')
      .populate('items.product', 'name images')
      .exec();
  }

  async findByUser(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{ data: IOrderDocument[]; total: number; page: number; limit: number }> {
    return this.findWithPagination(
      { user: userId },
      { page, limit, sort: { createdAt: -1 } }
    );
  }

  async findBySeller(
    sellerId: string,
    page = 1,
    limit = 20
  ): Promise<{ data: IOrderDocument[]; total: number; page: number; limit: number }> {
    const products = await this.model.db.model('Product').find({ seller: sellerId }).select('_id');
    const productIds = products.map((p) => p._id);

    return this.findWithPagination(
      { 'items.product': { $in: productIds } },
      { page, limit, sort: { createdAt: -1 } }
    );
  }

  async getSalesAnalytics(
    sellerId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const match: any = {
      orderStatus: { $ne: 'cancelled' },
    };

    if (sellerId) {
      const products = await this.model.db.model('Product').find({ seller: sellerId }).select('_id');
      match['items.product'] = { $in: products.map((p) => p._id) };
    }

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    return this.model.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$total' },
        },
      },
    ]);
  }
}
