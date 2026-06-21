import mongoose, { Schema, Document, Types } from 'mongoose';
import { TransferStatus } from '../../../shared/enums';
import { IInventoryTransfer } from '../../../shared/types';

export interface IInventoryTransferDocument extends Omit<IInventoryTransfer, '_id' | 'fromWarehouse' | 'toWarehouse' | 'product' | 'variant' | 'initiatedBy' | 'approvedBy'>, Document {
  fromWarehouse: Types.ObjectId;
  toWarehouse: Types.ObjectId;
  product: Types.ObjectId;
  variant: Types.ObjectId;
  initiatedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
}

const inventoryTransferSchema = new Schema<IInventoryTransferDocument>(
  {
    fromWarehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    toWarehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: Schema.Types.ObjectId, ref: 'Product.variants', required: true },
    quantity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: Object.values(TransferStatus), default: TransferStatus.PENDING },
    initiatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
    trackingReference: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

inventoryTransferSchema.index({ fromWarehouse: 1, status: 1 });
inventoryTransferSchema.index({ toWarehouse: 1, status: 1 });
inventoryTransferSchema.index({ status: 1 });
inventoryTransferSchema.index({ createdAt: -1 });

export default mongoose.model<IInventoryTransferDocument>('InventoryTransfer', inventoryTransferSchema);
