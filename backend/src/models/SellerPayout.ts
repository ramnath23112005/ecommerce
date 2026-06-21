import mongoose, { Schema, Document } from 'mongoose';
import { PayoutStatus, PayoutMethod } from '../../../shared/enums';
import { ISellerPayout } from '../../../shared/types';

export interface ISellerPayoutDocument extends Omit<ISellerPayout, '_id'>, Document {}

const sellerPayoutSchema = new Schema<ISellerPayoutDocument>(
  {
    seller: { type: Schema.Types.ObjectId, ref: 'SellerProfile', required: true },
    amount: { type: Number, required: true, min: 0 },
    commission: { type: Number, required: true, min: 0 },
    netAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(PayoutStatus), default: PayoutStatus.PENDING },
    method: { type: String, enum: Object.values(PayoutMethod), required: true },
    reference: { type: String },
    notes: { type: String },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

sellerPayoutSchema.index({ seller: 1, createdAt: -1 });
sellerPayoutSchema.index({ status: 1 });
sellerPayoutSchema.index({ periodStart: 1, periodEnd: 1 });

export default mongoose.model<ISellerPayoutDocument>('SellerPayout', sellerPayoutSchema);
