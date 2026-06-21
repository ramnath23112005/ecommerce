import mongoose, { Schema, Document, Types } from 'mongoose';
import { SellerStatus, CommissionType } from '../../../shared/enums';
import { ISellerProfile } from '../../../shared/types';

export interface ISellerProfileDocument extends Omit<ISellerProfile, '_id' | 'user' | 'approvedBy'>, Document {
  user: Types.ObjectId;
  approvedBy?: Types.ObjectId;
}

const sellerProfileSchema = new Schema<ISellerProfileDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    storeName: { type: String, required: true, trim: true, maxlength: 100 },
    storeSlug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    storeDescription: { type: String, trim: true, maxlength: 2000 },
    storeLogo: { type: String },
    storeBanner: { type: String },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    contactPhone: { type: String, trim: true },
    businessAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
      country: { type: String },
    },
    taxId: { type: String, trim: true },
    businessRegistration: { type: String, trim: true },
    status: { type: String, enum: Object.values(SellerStatus), default: SellerStatus.PENDING },
    commissionRate: { type: Number, default: 0 },
    commissionType: { type: String, enum: Object.values(CommissionType), default: CommissionType.PERCENTAGE },
    totalProducts: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalPayout: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

sellerProfileSchema.index({ storeSlug: 1 });
sellerProfileSchema.index({ user: 1 });
sellerProfileSchema.index({ status: 1 });
sellerProfileSchema.index({ isFeatured: 1, rating: -1 });

export default mongoose.model<ISellerProfileDocument>('SellerProfile', sellerProfileSchema);
