import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, TwoFactorMethod } from '../../../shared/enums';
import { IUser } from '../../../shared/types';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  canLogin(): boolean;
}

const addressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true, default: 'IN' },
  isDefault: { type: Boolean, default: false },
}, { _id: false });

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },
    avatar: { type: String },
    googleId: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },
    phone: { type: String },
    phoneVerified: { type: Boolean, default: false },
    address: { type: addressSchema },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethod: { type: String, enum: Object.values(TwoFactorMethod) },
    twoFactorSecret: { type: String, select: false },
    backupCodes: [{ type: String, select: false }],
    isLocked: { type: Boolean, default: false },
    lockUntil: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lastLogin: { type: Date },
    lastLoginIp: { type: String },
    accountRestoredAt: { type: Date },
    refreshToken: { type: String, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        delete ret.twoFactorSecret;
        delete ret.backupCodes;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.canLogin = function (): boolean {
  if (!this.isLocked) return true;
  if (this.lockUntil && this.lockUntil < new Date()) {
    this.isLocked = false;
    this.lockUntil = undefined;
    this.loginAttempts = 0;
    this.save();
    return true;
  }
  return false;
};

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isLocked: 1 });
userSchema.index({ 'backupCodes': 1 });

export default mongoose.model<IUserDocument>('User', userSchema);
