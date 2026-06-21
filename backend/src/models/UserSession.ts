import mongoose, { Schema, Document, Types } from 'mongoose';
import { SessionStatus } from '../../../shared/enums';
import { IUserSession } from '../../../shared/types';

export interface IUserSessionDocument extends Omit<IUserSession, '_id' | 'user'>, Document {
  user: Types.ObjectId;
}

const deviceInfoSchema = new Schema({
  userAgent: { type: String, default: '' },
  ip: { type: String, default: '' },
  platform: { type: String, default: '' },
  browser: { type: String, default: '' },
  location: { type: String },
}, { _id: false });

const userSessionSchema = new Schema<IUserSessionDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    deviceInfo: { type: deviceInfoSchema, default: () => ({}) },
    status: {
      type: String,
      enum: Object.values(SessionStatus),
      default: SessionStatus.ACTIVE,
    },
    lastActivity: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

userSessionSchema.index({ user: 1, status: 1 });
userSessionSchema.index({ refreshToken: 1 });
userSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IUserSessionDocument>('UserSession', userSessionSchema);
