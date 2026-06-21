import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import Review from '../models/Review';
import SellerProfile from '../models/SellerProfile';
import { PaymentStatus } from '../../../shared/enums';

export class AnalyticsService {
  async getExecutiveDashboard(query: { fromDate?: string; toDate?: string }): Promise<any> {
    const dateFilter: any = {};
    if (query.fromDate || query.toDate) {
      dateFilter.createdAt = {};
      if (query.fromDate) dateFilter.createdAt.$gte = new Date(query.fromDate);
      if (query.toDate) dateFilter.createdAt.$lte = new Date(query.toDate);
    }

    const dateFilterPaid = { ...dateFilter, paymentStatus: PaymentStatus.SUCCEEDED };

    const [
      totalRevenue, totalOrders, totalUsers, totalProducts, totalSellers,
      revenueByDay, ordersByStatus, topProducts, salesByCategory,
    ] = await Promise.all([
      Order.aggregate([{ $match: dateFilterPaid }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.countDocuments(dateFilter),
      User.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      SellerProfile.countDocuments({ status: 'approved' }),
      Order.aggregate([
        { $match: dateFilterPaid },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' } } },
        { $sort: { _id: 1 } },
        { $limit: 90 },
      ]),
      Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: dateFilterPaid },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', sales: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } } } },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        { $project: { product: '$product.name', sales: 1, revenue: 1 } },
      ]),
      Order.aggregate([
        { $match: dateFilterPaid },
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'categories', localField: 'product.category', foreignField: '_id', as: 'category' } },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$category.name', sales: { $sum: '$items.quantity' } } },
        { $sort: { sales: -1 } },
      ]),
    ]);

    return {
      totalRevenue: totalRevenue[0]?.total || 0,
      totalOrders,
      totalUsers,
      totalProducts,
      totalSellers,
      revenueByDay: revenueByDay.map((r: any) => ({ date: r._id, revenue: r.revenue })),
      ordersByStatus: ordersByStatus.map((r: any) => ({ status: r._id, count: r.count })),
      topProducts: topProducts.map((r: any) => ({ product: r.product || 'Unknown', sales: r.sales, revenue: r.revenue })),
      salesByCategory: salesByCategory.map((r: any) => ({ category: r._id || 'Uncategorized', sales: r.sales })),
    };
  }

  async getSellerAnalytics(sellerId: string, query: { fromDate?: string; toDate?: string }): Promise<any> {
    const dateFilter: any = {};
    if (query.fromDate || query.toDate) {
      dateFilter.createdAt = {};
      if (query.fromDate) dateFilter.createdAt.$gte = new Date(query.fromDate);
      if (query.toDate) dateFilter.createdAt.$lte = new Date(query.toDate);
    }

    const products = await Product.find({ seller: sellerId }).select('_id');
    const productIds = products.map((p) => p._id);

    const [totalSales, totalProducts, totalRevenue, recentOrders, topSelling] = await Promise.all([
      Order.aggregate([
        { $match: { ...dateFilter, 'items.product': { $in: productIds }, paymentStatus: PaymentStatus.SUCCEEDED } },
        { $unwind: '$items' },
        { $match: { 'items.product': { $in: productIds } } },
        { $group: { _id: null, total: { $sum: '$items.quantity' } } },
      ]),
      Product.countDocuments({ seller: sellerId, status: 'active' }),
      Order.aggregate([
        { $match: { ...dateFilter, 'items.product': { $in: productIds }, paymentStatus: PaymentStatus.SUCCEEDED } },
        { $unwind: '$items' },
        { $match: { 'items.product': { $in: productIds } } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$items.quantity', '$items.price'] } } } },
      ]),
      Order.find({ 'items.product': { $in: productIds } }).sort({ createdAt: -1 }).limit(10).populate('user', 'name'),
      Product.aggregate([
        { $match: { seller: sellerId, status: 'active' } },
        { $sort: { totalSales: -1 } },
        { $limit: 5 },
        { $project: { name: 1, totalSales: 1, averageRating: 1 } },
      ]),
    ]);

    return {
      totalSales: totalSales[0]?.total || 0,
      totalProducts,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentOrders,
      topSelling,
    };
  }
}

export const analyticsService = new AnalyticsService();
