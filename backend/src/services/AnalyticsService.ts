import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import { IAnalytics } from '../../../shared/types';
import { cacheData, getCachedData } from '../config/redis';

export class AnalyticsService {
  async getAdminAnalytics(startDate?: Date, endDate?: Date): Promise<IAnalytics> {
    const cacheKey = `analytics:admin:${startDate?.toISOString() || 'all'}:${endDate?.toISOString() || 'all'}`;
    const cached = await getCachedData<IAnalytics>(cacheKey);
    if (cached) return cached;

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = startDate;
      if (endDate) dateFilter.createdAt.$lte = endDate;
    }

    const [
      salesData,
      ordersByStatus,
      topProducts,
      totalProducts,
      totalUsers,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { ...dateFilter, orderStatus: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
      Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { ...dateFilter, orderStatus: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            sales: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            product: { $ifNull: ['$product.name', 'Deleted Product'] },
            sales: 1,
            revenue: 1,
          },
        },
      ]),
      Product.countDocuments({ status: 'active' }),
      User.countDocuments(),
    ]);

    const totalSales = salesData.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);

    const analytics: IAnalytics = {
      totalSales: Math.round(totalSales * 100) / 100,
      totalOrders,
      totalProducts,
      totalUsers,
      revenueByPeriod: salesData.map((d) => ({ date: d._id, revenue: d.revenue })),
      ordersByStatus: ordersByStatus.map((d: any) => ({ status: d._id, count: d.count })),
      topProducts: topProducts.map((d: any) => ({ product: d.product, sales: d.sales, revenue: d.revenue })),
      salesByCategory: [],
    };

    await cacheData(cacheKey, analytics, 600);
    return analytics;
  }

  async getSellerAnalytics(sellerId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = startDate;
      if (endDate) dateFilter.createdAt.$lte = endDate;
    }

    const products = await Product.find({ seller: sellerId }).select('_id name');
    const productIds = products.map((p) => p._id);

    const [salesData, productStats, ordersByStatus] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            ...dateFilter,
            orderStatus: { $ne: 'cancelled' },
            'items.product': { $in: productIds },
          },
        },
        { $unwind: '$items' },
        { $match: { 'items.product': { $in: productIds } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
      Product.aggregate([
        { $match: { seller: sellerId } },
        { $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } } } },
      ]),
      Order.aggregate([
        { $match: { ...dateFilter, 'items.product': { $in: productIds } } },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      totalProducts: productStats[0]?.total || 0,
      activeProducts: productStats[0]?.active || 0,
      revenueByPeriod: salesData.map((d) => ({ date: d._id, revenue: d.revenue })),
      ordersByStatus: ordersByStatus.map((d: any) => ({ status: d._id, count: d.count })),
      products: products.map((p) => p.name),
    };
  }
}
