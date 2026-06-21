import LoyaltyPoints from '../models/LoyaltyPoints';
import User from '../models/User';
import Order from '../models/Order';
import logger from '../utils/logger';

const POINTS_PER_DOLLAR = 10;
const REFERRAL_BONUS_POINTS = 500;
const REFERRAL_DISCOUNT_PERCENT = 10;

export class LoyaltyService {
  async getOrCreateLoyalty(userId: string): Promise<any> {
    let loyalty = await LoyaltyPoints.findOne({ user: userId });
    if (!loyalty) {
      loyalty = await LoyaltyPoints.create({ user: userId });
    }
    return loyalty;
  }

  async addPoints(userId: string, amount: number, orderId?: string): Promise<any> {
    const loyalty = await this.getOrCreateLoyalty(userId);
    const earnedPoints = Math.floor(amount * POINTS_PER_DOLLAR);
    loyalty.points += earnedPoints;
    loyalty.lifetimePoints += earnedPoints;
    await loyalty.save();

    logger.info(`[Loyalty] ${earnedPoints} points added to user ${userId} (tier: ${loyalty.tier})`);
    return loyalty;
  }

  async redeemPoints(userId: string, points: number): Promise<number> {
    const loyalty = await this.getOrCreateLoyalty(userId);
    if (loyalty.points < points) {
      throw new Error('Insufficient loyalty points.');
    }

    const discountValue = Math.floor(points / 100);
    loyalty.points -= points;
    await loyalty.save();

    logger.info(`[Loyalty] ${points} points redeemed by user ${userId}, discount: $${discountValue}`);
    return discountValue;
  }

  async createReferral(userId: string): Promise<string> {
    const code = `REF-${userId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    await User.findByIdAndUpdate(userId, { referralCode: code } as any);
    return code;
  }

  async processReferral(newUserId: string, referralCode: string): Promise<void> {
    const referrer = await User.findOne({ referralCode } as any);
    if (!referrer || referrer._id.toString() === newUserId) return;

    await this.addPoints(referrer._id.toString(), REFERRAL_BONUS_POINTS / POINTS_PER_DOLLAR);
    logger.info(`[Referral] User ${newUserId} referred by ${referrer.email}`);
  }

  async getOrderDiscount(userId: string, orderTotal: number): Promise<{ discount: number; appliedPoints: number }> {
    const loyalty = await this.getOrCreateLoyalty(userId);

    const tierMultipliers: Record<string, number> = { bronze: 0, silver: 0.05, gold: 0.1, platinum: 0.15 };
    const tierDiscount = orderTotal * (tierMultipliers[loyalty.tier] || 0);

    return { discount: Math.round(tierDiscount * 100) / 100, appliedPoints: 0 };
  }

  async getLoyaltyDashboard(userId: string): Promise<any> {
    const loyalty = await this.getOrCreateLoyalty(userId);
    const recentOrders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(5).select('total createdAt orderNumber');

    return {
      points: loyalty.points,
      lifetimePoints: loyalty.lifetimePoints,
      tier: loyalty.tier,
      nextTier: loyalty.tier === 'bronze' ? 'silver (1000 pts)' : loyalty.tier === 'silver' ? 'gold (5000 pts)' : loyalty.tier === 'gold' ? 'platinum (10000 pts)' : 'max',
      pointsToNextTier: loyalty.tier === 'bronze' ? 1000 - loyalty.lifetimePoints : loyalty.tier === 'silver' ? 5000 - loyalty.lifetimePoints : loyalty.tier === 'gold' ? 10000 - loyalty.lifetimePoints : 0,
      recentOrders,
    };
  }
}

export const loyaltyService = new LoyaltyService();
