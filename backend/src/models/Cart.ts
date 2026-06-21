import mongoose, { Schema, Document } from 'mongoose';
import { ICart, ICartItem } from '../../../shared/types';

export interface ICartDocument extends ICart, Document {}

const cartItemSchema = new Schema<ICartItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: { type: Schema.Types.ObjectId, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
}, { _id: false });

const cartSchema = new Schema<ICartDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    totalAmount: { type: Number, default: 0 },
    totalItems: { type: Number, default: 0 },
    coupon: { type: String },
    discount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

cartSchema.index({ user: 1 });

export default mongoose.model<ICartDocument>('Cart', cartSchema);
