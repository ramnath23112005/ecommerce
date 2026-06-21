import Wallet from '../models/Wallet';
import LedgerEntry from '../models/LedgerEntry';
import Payment from '../models/Payment';
import Order from '../models/Order';
import { BadRequestError, NotFoundError } from '../utils/AppError';
import logger from '../utils/logger';
import { PaymentStatus } from '../../../shared/enums';

export class PaymentV2Service {
  async getOrCreateWallet(userId: string): Promise<any> {
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await Wallet.create({ user: userId, balance: 0, currency: 'USD' });
    }
    return wallet;
  }

  async getWalletBalance(userId: string): Promise<number> {
    const wallet = await this.getOrCreateWallet(userId);
    return wallet.balance;
  }

  async creditWallet(userId: string, amount: number, reference: string, description: string, metadata: Record<string, any> = {}): Promise<any> {
    const wallet = await this.getOrCreateWallet(userId);
    const balanceBefore = wallet.balance;
    wallet.balance += amount;
    await wallet.save();

    await LedgerEntry.create({
      user: userId,
      type: 'credit',
      amount,
      balanceBefore,
      balanceAfter: wallet.balance,
      reference,
      referenceModel: 'Wallet',
      description,
      metadata,
    });

    logger.info(`[Wallet] Credited ${amount} to user ${userId}. Balance: ${balanceBefore} -> ${wallet.balance}`);
    return wallet;
  }

  async debitWallet(userId: string, amount: number, reference: string, description: string, metadata: Record<string, any> = {}): Promise<any> {
    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.balance < amount) {
      throw new BadRequestError('Insufficient wallet balance.');
    }

    const balanceBefore = wallet.balance;
    wallet.balance -= amount;
    await wallet.save();

    await LedgerEntry.create({
      user: userId,
      type: 'debit',
      amount,
      balanceBefore,
      balanceAfter: wallet.balance,
      reference,
      referenceModel: 'Wallet',
      description,
      metadata,
    });

    logger.info(`[Wallet] Debited ${amount} from user ${userId}. Balance: ${balanceBefore} -> ${wallet.balance}`);
    return wallet;
  }

  async processRefund(paymentId: string, amount?: number): Promise<any> {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found.');
    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestError('Only successful payments can be refunded.');
    }

    const refundAmount = amount || payment.amount;
    if (refundAmount > payment.amount) {
      throw new BadRequestError('Refund amount exceeds payment amount.');
    }

    payment.status = refundAmount === payment.amount ? PaymentStatus.REFUNDED : PaymentStatus.SUCCEEDED;
    payment.gatewayResponse = { ...payment.gatewayResponse, partialRefund: refundAmount };
    await payment.save();

    await this.creditWallet(
      (payment.user as any).toString?.() || payment.user.toString(),
      refundAmount,
      payment._id.toString(),
      `Refund for order ${payment.order}`,
      { refundAmount, originalPayment: paymentId }
    );

    logger.info(`[Payment] Refund of ${refundAmount} processed for payment ${paymentId}`);
    return payment;
  }

  async getLedger(userId: string, query: { page: number; limit: number }): Promise<{ data: any[]; total: number }> {
    const [data, total] = await Promise.all([
      LedgerEntry.find({ user: userId }).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit),
      LedgerEntry.countDocuments({ user: userId }),
    ]);
    return { data, total };
  }

  async getPaymentAnalytics(query: { fromDate?: string; toDate?: string }): Promise<any> {
    const match: any = {};
    if (query.fromDate || query.toDate) {
      match.createdAt = {};
      if (query.fromDate) match.createdAt.$gte = new Date(query.fromDate);
      if (query.toDate) match.createdAt.$lte = new Date(query.toDate);
    }

    const analytics = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const totalRevenue = await Payment.aggregate([
      { $match: { ...match, status: PaymentStatus.SUCCEEDED } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return {
      byStatus: analytics,
      totalRevenue: totalRevenue[0]?.total || 0,
    };
  }
}

export const paymentV2Service = new PaymentV2Service();
