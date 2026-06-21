import mongoose, { Schema, Document, Types } from 'mongoose';
import { IInventoryItem } from '../../../shared/types';

export interface IInventoryItemDocument extends Omit<IInventoryItem, '_id' | 'product' | 'variant' | 'warehouse'>, Document {
  product: Types.ObjectId;
  variant: Types.ObjectId;
  warehouse: Types.ObjectId;
}

const inventoryItemSchema = new Schema<IInventoryItemDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: Schema.Types.ObjectId, ref: 'Product.variants', required: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    availableQuantity: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    reorderPoint: { type: Number, default: 5 },
    locationInWarehouse: { type: String, trim: true },
    batchNumber: { type: String, trim: true },
    expiryDate: { type: Date },
  },
  { timestamps: true }
);

inventoryItemSchema.index({ product: 1, variant: 1, warehouse: 1 }, { unique: true });
inventoryItemSchema.index({ warehouse: 1 });
inventoryItemSchema.index({ availableQuantity: 1 });
inventoryItemSchema.index({ product: 1 });
inventoryItemSchema.index({ batchNumber: 1 });

export default mongoose.model<IInventoryItemDocument>('InventoryItem', inventoryItemSchema);
