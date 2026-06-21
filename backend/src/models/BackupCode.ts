import mongoose, { Schema, Document, Types } from 'mongoose';
import crypto from 'crypto';
import { IBackupCode } from '../../../shared/types';

export interface IBackupCodeDocument extends Omit<IBackupCode, '_id' | 'user'>, Document {
  user: Types.ObjectId;
}

const backupCodeSchema = new Schema<IBackupCodeDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    usedAt: { type: Date },
  },
  { timestamps: true }
);

backupCodeSchema.index({ user: 1, code: 1 });
backupCodeSchema.index({ user: 1, usedAt: 1 });

export default mongoose.model<IBackupCodeDocument>('BackupCode', backupCodeSchema);
