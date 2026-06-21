import SellerProfile from '../models/SellerProfile';
import SellerPayout from '../models/SellerPayout';
import SellerBankAccount from '../models/SellerBankAccount';
import Commission from '../models/Commission';
import Storefront from '../models/Storefront';
import User from '../models/User';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/AppError';
import logger from '../utils/logger';
import { SellerStatus, UserRole, CommissionType, PayoutStatus } from '../../../shared/enums';

export class SellerService {
  async requestSellerAccount(userId: string, data: {
    storeName: string;
    storeSlug: string;
    storeDescription?: string;
    contactEmail: string;
    contactPhone?: string;
    businessAddress?: any;
    taxId?: string;
    businessRegistration?: string;
  }): Promise<any> {
    const existing = await SellerProfile.findOne({ user: userId });
    if (existing) {
      throw new BadRequestError('Seller profile already exists for this user.');
    }

    const slugExists = await SellerProfile.findOne({ storeSlug: data.storeSlug });
    if (slugExists) {
      throw new BadRequestError('Store slug is already taken.');
    }

    const profile = await SellerProfile.create({
      user: userId,
      storeName: data.storeName,
      storeSlug: data.storeSlug,
      storeDescription: data.storeDescription,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      businessAddress: data.businessAddress,
      taxId: data.taxId,
      businessRegistration: data.businessRegistration,
      status: SellerStatus.PENDING,
      joinedAt: new Date(),
    });

    await Storefront.create({ seller: profile._id });

    await User.findByIdAndUpdate(userId, { role: UserRole.SELLER });

    logger.info(`Seller account requested for user ${userId}, store: ${data.storeName}`);
    return profile;
  }

  async approveSeller(profileId: string, adminId: string): Promise<any> {
    const profile = await SellerProfile.findById(profileId);
    if (!profile) throw new NotFoundError('Seller profile not found.');
    if (profile.status !== SellerStatus.PENDING) {
      throw new BadRequestError('Seller profile is not pending approval.');
    }

    profile.status = SellerStatus.APPROVED;
    profile.approvedAt = new Date();
    profile.approvedBy = adminId as any;
    await profile.save();

    logger.info(`Seller ${profile.storeName} approved by admin ${adminId}`);
    return profile;
  }

  async rejectSeller(profileId: string, adminId: string, reason: string): Promise<any> {
    const profile = await SellerProfile.findById(profileId);
    if (!profile) throw new NotFoundError('Seller profile not found.');
    if (profile.status !== SellerStatus.PENDING) {
      throw new BadRequestError('Seller profile is not pending approval.');
    }

    profile.status = SellerStatus.REJECTED;
    profile.rejectionReason = reason;
    profile.approvedBy = adminId as any;
    await profile.save();

    await User.findByIdAndUpdate(profile.user, { role: UserRole.CUSTOMER });

    logger.info(`Seller ${profile.storeName} rejected by admin ${adminId}: ${reason}`);
    return profile;
  }

  async suspendSeller(profileId: string, adminId: string, reason: string): Promise<any> {
    const profile = await SellerProfile.findById(profileId);
    if (!profile) throw new NotFoundError('Seller profile not found.');

    profile.status = SellerStatus.SUSPENDED;
    profile.rejectionReason = reason;
    await profile.save();

    logger.warn(`Seller ${profile.storeName} suspended by admin ${adminId}: ${reason}`);
    return profile;
  }

  async reinstateSeller(profileId: string, adminId: string): Promise<any> {
    const profile = await SellerProfile.findById(profileId);
    if (!profile) throw new NotFoundError('Seller profile not found.');
    if (profile.status !== SellerStatus.SUSPENDED) {
      throw new BadRequestError('Seller profile is not suspended.');
    }

    profile.status = SellerStatus.APPROVED;
    profile.rejectionReason = undefined;
    await profile.save();

    logger.info(`Seller ${profile.storeName} reinstated by admin ${adminId}`);
    return profile;
  }

  async getSellerProfile(userId: string): Promise<any> {
    const profile = await SellerProfile.findOne({ user: userId }).populate('user', 'name email avatar');
    if (!profile) throw new NotFoundError('Seller profile not found.');
    return profile;
  }

  async getSellerProfileById(profileId: string): Promise<any> {
    const profile = await SellerProfile.findById(profileId).populate('user', 'name email avatar');
    if (!profile) throw new NotFoundError('Seller profile not found.');
    return profile;
  }

  async getPublicStore(storeSlug: string): Promise<any> {
    const profile = await SellerProfile.findOne({ storeSlug, status: SellerStatus.APPROVED })
      .populate('user', 'name avatar');
    if (!profile) throw new NotFoundError('Store not found.');
    const storefront = await Storefront.findOne({ seller: profile._id });
    return { profile, storefront };
  }

  async updateSellerProfile(userId: string, data: Partial<{
    storeName: string;
    storeDescription: string;
    storeLogo: string;
    storeBanner: string;
    contactEmail: string;
    contactPhone: string;
    businessAddress: any;
  }>): Promise<any> {
    const profile = await SellerProfile.findOne({ user: userId });
    if (!profile) throw new NotFoundError('Seller profile not found.');
    if (profile.status !== SellerStatus.APPROVED) {
      throw new ForbiddenError('Your seller account must be approved to update profile.');
    }

    Object.assign(profile, data);
    await profile.save();
    return profile;
  }

  async getSellersForAdmin(query: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: number;
  }): Promise<{ data: any[]; total: number }> {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { storeName: { $regex: query.search, $options: 'i' } },
        { storeSlug: { $regex: query.search, $options: 'i' } },
        { contactEmail: { $regex: query.search, $options: 'i' } },
      ];
    }

    const sort: any = {};
    sort[query.sortBy || 'createdAt'] = query.sortOrder || -1;

    const [data, total] = await Promise.all([
      SellerProfile.find(filter)
        .populate('user', 'name email')
        .sort(sort)
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      SellerProfile.countDocuments(filter),
    ]);

    return { data, total };
  }

  async getSellerStorefront(userId: string): Promise<any> {
    const profile = await SellerProfile.findOne({ user: userId });
    if (!profile) throw new NotFoundError('Seller profile not found.');
    const storefront = await Storefront.findOne({ seller: profile._id });
    if (!storefront) throw new NotFoundError('Storefront not found.');
    return storefront;
  }

  async updateStorefront(userId: string, data: Partial<{
    theme: Record<string, string>;
    layout: string;
    seo: { title?: string; description?: string; keywords?: string[] };
  }>): Promise<any> {
    const profile = await SellerProfile.findOne({ user: userId });
    if (!profile) throw new NotFoundError('Seller profile not found.');
    if (profile.status !== SellerStatus.APPROVED) {
      throw new ForbiddenError('Seller account must be approved to update storefront.');
    }

    const storefront = await Storefront.findOneAndUpdate(
      { seller: profile._id },
      { $set: data },
      { new: true }
    );
    return storefront;
  }

  async addBankAccount(userId: string, data: {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    bankCode?: string;
    branchCode?: string;
    currency?: string;
    isDefault?: boolean;
  }): Promise<any> {
    const profile = await SellerProfile.findOne({ user: userId });
    if (!profile) throw new NotFoundError('Seller profile not found.');
    if (profile.status !== SellerStatus.APPROVED) {
      throw new ForbiddenError('Seller account must be approved to add bank accounts.');
    }

    if (data.isDefault) {
      await SellerBankAccount.updateMany(
        { seller: profile._id },
        { $set: { isDefault: false } }
      );
    }

    const account = await SellerBankAccount.create({
      seller: profile._id,
      ...data,
      currency: data.currency || 'USD',
    });

    logger.info(`Bank account added for seller ${profile._id}`);
    return account;
  }

  async getBankAccounts(userId: string): Promise<any[]> {
    const profile = await SellerProfile.findOne({ user: userId });
    if (!profile) throw new NotFoundError('Seller profile not found.');
    return SellerBankAccount.find({ seller: profile._id });
  }

  async deleteBankAccount(userId: string, accountId: string): Promise<void> {
    const profile = await SellerProfile.findOne({ user: userId });
    if (!profile) throw new NotFoundError('Seller profile not found.');

    const account = await SellerBankAccount.findOne({ _id: accountId, seller: profile._id });
    if (!account) throw new NotFoundError('Bank account not found.');

    await account.deleteOne();
    logger.info(`Bank account ${accountId} deleted for seller ${profile._id}`);
  }

  async calculateCommission(amount: number, categoryId?: string, sellerId?: string): Promise<{
    rate: number;
    type: CommissionType;
    commission: number;
  }> {
    const now = new Date();

    const commissionRule = await Commission.findOne({
      $or: [
        { seller: sellerId, effectiveFrom: { $lte: now }, $or: [{ effectiveTo: { $gte: now } }, { effectiveTo: null }] },
        { category: categoryId, effectiveFrom: { $lte: now }, $or: [{ effectiveTo: { $gte: now } }, { effectiveTo: null }] },
        { isGlobal: true, effectiveFrom: { $lte: now }, $or: [{ effectiveTo: { $gte: now } }, { effectiveTo: null }] },
      ],
      $and: [
        { $or: [{ seller: sellerId }, { seller: null }] },
      ],
    }).sort({ priority: -1 });

    if (!commissionRule) {
      return { rate: 0, type: CommissionType.PERCENTAGE, commission: 0 };
    }

    let commission: number;
    if (commissionRule.type === CommissionType.PERCENTAGE) {
      commission = (amount * commissionRule.rate) / 100;
    } else {
      commission = commissionRule.rate;
    }

    return { rate: commissionRule.rate, type: commissionRule.type, commission };
  }

  async createCommissionRule(data: {
    rate: number;
    type: CommissionType;
    isGlobal: boolean;
    priority: number;
    effectiveFrom: string;
    effectiveTo?: string;
    category?: string;
    seller?: string;
  }): Promise<any> {
    return Commission.create(data);
  }

  async getCommissionRules(query: {
    page: number;
    limit: number;
    isGlobal?: boolean;
  }): Promise<{ data: any[]; total: number }> {
    const filter: any = {};
    if (query.isGlobal !== undefined) filter.isGlobal = query.isGlobal;

    const [data, total] = await Promise.all([
      Commission.find(filter)
        .populate('category', 'name')
        .populate('seller', 'storeName')
        .sort({ priority: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      Commission.countDocuments(filter),
    ]);

    return { data, total };
  }

  async getSellerDashboard(userId: string): Promise<any> {
    const profile = await SellerProfile.findOne({ user: userId });
    if (!profile) throw new NotFoundError('Seller profile not found.');

    const pendingPayouts = await SellerPayout.aggregate([
      { $match: { seller: profile._id, status: PayoutStatus.PENDING } },
      { $group: { _id: null, total: { $sum: '$netAmount' }, count: { $sum: 1 } } },
    ]);

    const recentPayouts = await SellerPayout.find({ seller: profile._id })
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      profile,
      pendingPayouts: pendingPayouts[0]?.total || 0,
      pendingPayoutsCount: pendingPayouts[0]?.count || 0,
      recentPayouts,
    };
  }

  async getPayoutHistory(userId: string, query: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<{ data: any[]; total: number }> {
    const profile = await SellerProfile.findOne({ user: userId });
    if (!profile) throw new NotFoundError('Seller profile not found.');

    const filter: any = { seller: profile._id };
    if (query.status) filter.status = query.status;

    const [data, total] = await Promise.all([
      SellerPayout.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      SellerPayout.countDocuments(filter),
    ]);

    return { data, total };
  }
}

export const sellerService = new SellerService();
