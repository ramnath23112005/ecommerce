import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILoyaltyPointsDocument extends Document {
  user: Types.ObjectId;
  points: number;
  lifetimePoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  calculateTier: () => string;
  createdAt: Date;
  updatedAt: Date;
}

const loyaltyPointsSchema = new Schema<ILoyaltyPointsDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    points: { type: Number, default: 0, min: 0 },
    lifetimePoints: { type: Number, default: 0, min: 0 },
    tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  },
  { timestamps: true }
);

loyaltyPointsSchema.methods.calculateTier = function (): string {
  if (this.lifetimePoints >= 10000) return 'platinum';
  if (this.lifetimePoints >= 5000) return 'gold';
  if (this.lifetimePoints >= 1000) return 'silver';
  return 'bronze';
};

loyaltyPointsSchema.pre('save', function (next) {
  this.tier = this.calculateTier() as any;
  next();
});

export default mongoose.model<ILoyaltyPointsDocument>('LoyaltyPoints', loyaltyPointsSchema);
