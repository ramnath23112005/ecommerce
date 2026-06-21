import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILedgerEntryDocument extends Document {
  user: Types.ObjectId;
  type: 'credit' | 'debit';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  referenceModel: string;
  description: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

const ledgerEntrySchema = new Schema<ILedgerEntryDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true, min: 0 },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reference: { type: String, required: true },
    referenceModel: { type: String, required: true },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

ledgerEntrySchema.index({ user: 1, createdAt: -1 });
ledgerEntrySchema.index({ reference: 1, referenceModel: 1 });

export default mongoose.model<ILedgerEntryDocument>('LedgerEntry', ledgerEntrySchema);
