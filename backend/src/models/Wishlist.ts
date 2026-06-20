import mongoose, { Schema, Document } from 'mongoose';
import { IWishlist } from '../../shared/types';

export interface IWishlistDocument extends IWishlist, Document {}

const wishlistSchema = new Schema<IWishlistDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    products: [{
      type: Schema.Types.ObjectId,
      ref: 'Product',
    }],
  },
  { timestamps: true }
);

wishlistSchema.index({ user: 1 });

export default mongoose.model<IWishlistDocument>('Wishlist', wishlistSchema);
