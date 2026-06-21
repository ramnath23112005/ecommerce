import mongoose, { Schema, Document, Types } from 'mongoose';
import { CommissionType } from '../../../shared/enums';
import { ICommission } from '../../../shared/types';

export interface ICommissionDocument extends Omit<ICommission, '_id' | 'category' | 'seller'>, Document {
  category?: Types.ObjectId;
  seller?: Types.ObjectId;
}

const commissionSchema = new Schema<ICommissionDocument>(
  {
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    seller: { type: Schema.Types.ObjectId, ref: 'SellerProfile' },
    rate: { type: Number, required: true, min: 0, max: 100 },
    type: { type: String, enum: Object.values(CommissionType), default: CommissionType.PERCENTAGE },
    isGlobal: { type: Boolean, default: false },
    priority: { type: Number, default: 0 },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date },
  },
  { timestamps: true }
);

commissionSchema.index({ isGlobal: 1, priority: 1 });
commissionSchema.index({ category: 1, priority: 1 });
commissionSchema.index({ seller: 1, priority: 1 });
commissionSchema.index({ effectiveFrom: 1, effectiveTo: 1 });

export default mongoose.model<ICommissionDocument>('Commission', commissionSchema);
