import mongoose, { Schema, Document, Types } from 'mongoose';
import { WarehouseStatus } from '../../../shared/enums';
import { IWarehouse } from '../../../shared/types';

export interface IWarehouseDocument extends Omit<IWarehouse, '_id'>, Document {}

const warehouseSchema = new Schema<IWarehouseDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 20 },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, required: true },
    },
    contactName: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    capacity: {
      maxItems: { type: Number, required: true, min: 0 },
      currentItems: { type: Number, default: 0, min: 0 },
    },
    status: { type: String, enum: Object.values(WarehouseStatus), default: WarehouseStatus.ACTIVE },
    isDefault: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

warehouseSchema.index({ code: 1 });
warehouseSchema.index({ status: 1 });
warehouseSchema.index({ isDefault: 1 });

export default mongoose.model<IWarehouseDocument>('Warehouse', warehouseSchema);
