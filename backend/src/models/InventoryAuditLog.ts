import mongoose, { Schema, Document, Types } from 'mongoose';
import { InventoryChangeType } from '../../../shared/enums';
import { IInventoryAuditLog } from '../../../shared/types';

export interface IInventoryAuditLogDocument extends Omit<IInventoryAuditLog, '_id' | 'product' | 'variant' | 'warehouse' | 'performedBy'>, Document {
  product: Types.ObjectId;
  variant: Types.ObjectId;
  warehouse: Types.ObjectId;
  performedBy?: Types.ObjectId;
}

const inventoryAuditLogSchema = new Schema<IInventoryAuditLogDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: Schema.Types.ObjectId, ref: 'Product.variants', required: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    changeType: { type: String, enum: Object.values(InventoryChangeType), required: true },
    quantityBefore: { type: Number, required: true },
    quantityAfter: { type: Number, required: true },
    quantityChange: { type: Number, required: true },
    reference: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: true }
);

inventoryAuditLogSchema.index({ product: 1, variant: 1 });
inventoryAuditLogSchema.index({ warehouse: 1, createdAt: -1 });
inventoryAuditLogSchema.index({ changeType: 1 });
inventoryAuditLogSchema.index({ performedBy: 1 });

export default mongoose.model<IInventoryAuditLogDocument>('InventoryAuditLog', inventoryAuditLogSchema);
