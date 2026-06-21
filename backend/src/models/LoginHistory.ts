import mongoose, { Schema, Document, Types } from 'mongoose';
import { LoginMethod, LoginStatus } from '../../../shared/enums';
import { ILoginHistory } from '../../../shared/types';

export interface ILoginHistoryDocument extends Omit<ILoginHistory, '_id' | 'user'>, Document {
  user: Types.ObjectId;
}

const loginHistorySchema = new Schema<ILoginHistoryDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    method: {
      type: String,
      enum: Object.values(LoginMethod),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(LoginStatus),
      required: true,
    },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    device: { type: String, default: '' },
    location: { type: String },
    reason: { type: String },
  },
  { timestamps: true }
);

loginHistorySchema.index({ user: 1, createdAt: -1 });
loginHistorySchema.index({ user: 1, status: 1 });
loginHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model<ILoginHistoryDocument>('LoginHistory', loginHistorySchema);
