import mongoose, { Schema, Document, Types } from 'mongoose';
import crypto from 'crypto';
import { VerificationType } from '../../../shared/enums';
import { IVerificationToken } from '../../../shared/types';

export interface IVerificationTokenDocument extends Omit<IVerificationToken, '_id' | 'user'>, Document {
  user: Types.ObjectId;
}

const verificationTokenSchema = new Schema<IVerificationTokenDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(VerificationType),
      required: true,
    },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true }
);

verificationTokenSchema.index({ token: 1 }, { unique: true });
verificationTokenSchema.index({ user: 1, type: 1 });
verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IVerificationTokenDocument>('VerificationToken', verificationTokenSchema);
