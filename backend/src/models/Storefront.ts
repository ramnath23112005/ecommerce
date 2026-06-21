import mongoose, { Schema, Document } from 'mongoose';
import { IStorefront } from '../../../shared/types';

export interface IStorefrontDocument extends Omit<IStorefront, '_id'>, Document {}

const storefrontSchema = new Schema<IStorefrontDocument>(
  {
    seller: { type: Schema.Types.ObjectId, ref: 'SellerProfile', required: true, unique: true },
    theme: { type: Schema.Types.Mixed, default: {} },
    layout: { type: String, default: 'default' },
    customDomain: { type: String, unique: true, sparse: true },
    seo: {
      title: { type: String },
      description: { type: String },
      keywords: [{ type: String }],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

storefrontSchema.index({ seller: 1 });
storefrontSchema.index({ customDomain: 1 });

export default mongoose.model<IStorefrontDocument>('Storefront', storefrontSchema);
