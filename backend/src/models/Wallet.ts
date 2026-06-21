import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWalletDocument extends Document {
  user: Types.ObjectId;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWalletDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD' },
  },
  { timestamps: true }
);

export default mongoose.model<IWalletDocument>('Wallet', walletSchema);
