import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProductBundleDocument extends Document {
  name: string;
  description: string;
  products: Array<{ product: Types.ObjectId; variant: Types.ObjectId; quantity: number }>;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  isActive: boolean;
  validFrom?: Date;
  validTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const productBundleSchema = new Schema<IProductBundleDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    products: [{
      product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      variant: { type: Schema.Types.ObjectId, required: true },
      quantity: { type: Number, required: true, min: 1 },
    }],
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    validFrom: { type: Date },
    validTo: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IProductBundleDocument>('ProductBundle', productBundleSchema);
