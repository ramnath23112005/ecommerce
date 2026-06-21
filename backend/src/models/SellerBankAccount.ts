import mongoose, { Schema, Document } from 'mongoose';
import { ISellerBankAccount } from '../../../shared/types';

export interface ISellerBankAccountDocument extends Omit<ISellerBankAccount, '_id'>, Document {}

const sellerBankAccountSchema = new Schema<ISellerBankAccountDocument>(
  {
    seller: { type: Schema.Types.ObjectId, ref: 'SellerProfile', required: true },
    accountHolderName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true },
    bankName: { type: String, required: true, trim: true },
    bankCode: { type: String, trim: true },
    branchCode: { type: String, trim: true },
    currency: { type: String, default: 'USD', trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

sellerBankAccountSchema.index({ seller: 1 });
sellerBankAccountSchema.index({ seller: 1, isDefault: 1 });

export default mongoose.model<ISellerBankAccountDocument>('SellerBankAccount', sellerBankAccountSchema);
