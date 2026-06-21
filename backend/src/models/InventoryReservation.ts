import mongoose, { Schema, Document, Types } from 'mongoose';
import { ReservationStatus } from '../../../shared/enums';
import { IInventoryReservation } from '../../../shared/types';

export interface IInventoryReservationDocument extends Omit<IInventoryReservation, '_id' | 'product' | 'variant' | 'warehouse' | 'order'>, Document {
  product: Types.ObjectId;
  variant: Types.ObjectId;
  warehouse: Types.ObjectId;
  order?: Types.ObjectId;
}

const inventoryReservationSchema = new Schema<IInventoryReservationDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: Schema.Types.ObjectId, ref: 'Product.variants', required: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    quantity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: Object.values(ReservationStatus), default: ReservationStatus.ACTIVE },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

inventoryReservationSchema.index({ product: 1, variant: 1, warehouse: 1, status: 1 });
inventoryReservationSchema.index({ order: 1 });
inventoryReservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
inventoryReservationSchema.index({ status: 1, expiresAt: 1 });

export default mongoose.model<IInventoryReservationDocument>('InventoryReservation', inventoryReservationSchema);
