import InventoryItem from '../models/InventoryItem';
import InventoryTransfer from '../models/InventoryTransfer';
import InventoryReservation from '../models/InventoryReservation';
import InventoryAuditLog from '../models/InventoryAuditLog';
import Warehouse from '../models/Warehouse';
import { BadRequestError, NotFoundError } from '../utils/AppError';
import logger from '../utils/logger';
import { TransferStatus, ReservationStatus, InventoryChangeType } from '../../../shared/enums';

export class InventoryService {
  // --- Warehouses ---

  async createWarehouse(data: {
    name: string; code: string; address: any; contactName: string;
    contactPhone: string; email: string; capacity: number; isDefault?: boolean;
  }): Promise<any> {
    const existing = await Warehouse.findOne({ code: data.code });
    if (existing) throw new BadRequestError('Warehouse code already exists.');

    if (data.isDefault) {
      await Warehouse.updateMany({}, { $set: { isDefault: false } });
    }

    const warehouse = await Warehouse.create({
      ...data,
      capacity: { maxItems: data.capacity, currentItems: 0 },
    });

    logger.info(`Warehouse created: ${warehouse.name} (${warehouse.code})`);
    return warehouse;
  }

  async updateWarehouse(warehouseId: string, data: Partial<any>): Promise<any> {
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) throw new NotFoundError('Warehouse not found.');

    if (data.isDefault) {
      await Warehouse.updateMany({ _id: { $ne: warehouseId } }, { $set: { isDefault: false } });
    }

    Object.assign(warehouse, data);
    await warehouse.save();
    return warehouse;
  }

  async getWarehouses(query: { page: number; limit: number; status?: string }): Promise<{ data: any[]; total: number }> {
    const filter: any = {};
    if (query.status) filter.status = query.status;

    const [data, total] = await Promise.all([
      Warehouse.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      Warehouse.countDocuments(filter),
    ]);
    return { data, total };
  }

  async getWarehouseById(warehouseId: string): Promise<any> {
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) throw new NotFoundError('Warehouse not found.');
    return warehouse;
  }

  // --- Inventory Items ---

  async getInventory(query: {
    page: number; limit: number; warehouseId?: string; productId?: string;
    lowStock?: boolean; search?: string;
  }): Promise<{ data: any[]; total: number }> {
    const filter: any = {};
    if (query.warehouseId) filter.warehouse = query.warehouseId;
    if (query.productId) filter.product = query.productId;
    if (query.lowStock) {
      filter.$expr = { $lte: ['$availableQuantity', '$lowStockThreshold'] };
    }
    if (query.search) {
      filter.$or = [
        { batchNumber: { $regex: query.search, $options: 'i' } },
        { locationInWarehouse: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      InventoryItem.find(filter)
        .populate('product', 'name slug')
        .populate('warehouse', 'name code')
        .sort({ availableQuantity: 1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      InventoryItem.countDocuments(filter),
    ]);
    return { data, total };
  }

  async adjustStock(
    productId: string, variantId: string, warehouseId: string,
    quantity: number, performedBy: string, notes?: string
  ): Promise<any> {
    let item = await InventoryItem.findOne({ product: productId, variant: variantId, warehouse: warehouseId });
    if (!item) {
      item = await InventoryItem.create({
        product: productId, variant: variantId, warehouse: warehouseId,
        quantity: 0, reservedQuantity: 0, availableQuantity: 0,
      });
    }

    const quantityBefore = item.quantity;
    item.quantity += quantity;
    item.availableQuantity = item.quantity - item.reservedQuantity;
    if (item.availableQuantity < 0) item.availableQuantity = 0;
    await item.save();

    const warehouse = await Warehouse.findById(warehouseId);
    if (warehouse) {
      warehouse.capacity.currentItems += quantity;
      await warehouse.save();
    }

    await InventoryAuditLog.create({
      product: productId, variant: variantId, warehouse: warehouseId,
      changeType: InventoryChangeType.ADJUSTMENT,
      quantityBefore, quantityAfter: item.quantity,
      quantityChange: quantity, performedBy, notes,
    });

    logger.info(`Stock adjusted: ${item.product} (variant ${variantId}): ${quantityBefore} -> ${item.quantity}`);
    return item;
  }

  async checkAndUpdateAvailability(productId: string, variantId: string, warehouseId: string): Promise<number> {
    const item = await InventoryItem.findOne({ product: productId, variant: variantId, warehouse: warehouseId });
    if (!item) return 0;
    item.availableQuantity = item.quantity - item.reservedQuantity;
    if (item.availableQuantity < 0) item.availableQuantity = 0;
    await item.save();
    return item.availableQuantity;
  }

  // --- Inventory Transfers ---

  async createTransfer(data: {
    fromWarehouse: string; toWarehouse: string; product: string;
    variant: string; quantity: number; initiatedBy: string; notes?: string;
  }): Promise<any> {
    if (data.fromWarehouse === data.toWarehouse) {
      throw new BadRequestError('Source and destination warehouses must differ.');
    }

    const sourceItem = await InventoryItem.findOne({
      product: data.product, variant: data.variant, warehouse: data.fromWarehouse,
    });
    if (!sourceItem || sourceItem.availableQuantity < data.quantity) {
      throw new BadRequestError('Insufficient available stock for transfer.');
    }

    const transfer = await InventoryTransfer.create({
      ...data,
      status: TransferStatus.PENDING,
    });

    logger.info(`Transfer created: ${transfer._id} - ${data.product} x${data.quantity}`);
    return transfer;
  }

  async approveTransfer(transferId: string, approvedBy: string): Promise<any> {
    const transfer = await InventoryTransfer.findById(transferId);
    if (!transfer) throw new NotFoundError('Transfer not found.');
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestError('Transfer is not in pending status.');
    }

    const sourceItem = await InventoryItem.findOne({
      product: transfer.product, variant: transfer.variant, warehouse: transfer.fromWarehouse,
    });
    if (!sourceItem || sourceItem.availableQuantity < transfer.quantity) {
      throw new BadRequestError('Insufficient stock. Release and retry.');
    }

    sourceItem.quantity -= transfer.quantity;
    sourceItem.reservedQuantity -= transfer.quantity;
    sourceItem.availableQuantity = sourceItem.quantity - sourceItem.reservedQuantity;
    await sourceItem.save();

    let destItem = await InventoryItem.findOne({
      product: transfer.product, variant: transfer.variant, warehouse: transfer.toWarehouse,
    });
    if (!destItem) {
      destItem = await InventoryItem.create({
        product: transfer.product, variant: transfer.variant, warehouse: transfer.toWarehouse,
        quantity: 0, reservedQuantity: 0, availableQuantity: 0,
      });
    }

    destItem.quantity += transfer.quantity;
    destItem.availableQuantity = destItem.quantity - destItem.reservedQuantity;
    await destItem.save();

    transfer.status = TransferStatus.COMPLETED;
    transfer.approvedBy = approvedBy as any;
    transfer.completedAt = new Date();
    await transfer.save();

    await InventoryAuditLog.create({
      product: transfer.product, variant: transfer.variant, warehouse: transfer.fromWarehouse,
      changeType: InventoryChangeType.TRANSFERRED_OUT,
      quantityBefore: sourceItem.quantity + transfer.quantity,
      quantityAfter: sourceItem.quantity,
      quantityChange: -transfer.quantity,
      reference: `transfer:${transfer._id}`,
      performedBy: approvedBy,
    });

    await InventoryAuditLog.create({
      product: transfer.product, variant: transfer.variant, warehouse: transfer.toWarehouse,
      changeType: InventoryChangeType.TRANSFERRED_IN,
      quantityBefore: destItem.quantity - transfer.quantity,
      quantityAfter: destItem.quantity,
      quantityChange: transfer.quantity,
      reference: `transfer:${transfer._id}`,
      performedBy: approvedBy,
    });

    logger.info(`Transfer ${transferId} approved and completed by ${approvedBy}`);
    return transfer;
  }

  async cancelTransfer(transferId: string): Promise<any> {
    const transfer = await InventoryTransfer.findById(transferId);
    if (!transfer) throw new NotFoundError('Transfer not found.');
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestError('Can only cancel pending transfers.');
    }

    transfer.status = TransferStatus.CANCELLED;
    await transfer.save();

    logger.info(`Transfer ${transferId} cancelled`);
    return transfer;
  }

  async getTransfers(query: {
    page: number; limit: number; status?: string; warehouseId?: string;
  }): Promise<{ data: any[]; total: number }> {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.warehouseId) {
      filter.$or = [{ fromWarehouse: query.warehouseId }, { toWarehouse: query.warehouseId }];
    }

    const [data, total] = await Promise.all([
      InventoryTransfer.find(filter)
        .populate('fromWarehouse', 'name code')
        .populate('toWarehouse', 'name code')
        .populate('product', 'name slug')
        .populate('initiatedBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      InventoryTransfer.countDocuments(filter),
    ]);
    return { data, total };
  }

  // --- Reservations ---

  async reserveStock(
    productId: string, variantId: string, warehouseId: string,
    quantity: number, orderId?: string, ttlMinutes = 30
  ): Promise<any> {
    const item = await InventoryItem.findOne({ product: productId, variant: variantId, warehouse: warehouseId });
    if (!item || item.availableQuantity < quantity) {
      throw new BadRequestError('Insufficient stock available for reservation.');
    }

    item.reservedQuantity += quantity;
    item.availableQuantity = item.quantity - item.reservedQuantity;
    await item.save();

    const reservation = await InventoryReservation.create({
      product: productId, variant: variantId, warehouse: warehouseId,
      order: orderId, quantity, status: ReservationStatus.ACTIVE,
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
    });

    await InventoryAuditLog.create({
      product: productId, variant: variantId, warehouse: warehouseId,
      changeType: InventoryChangeType.RESERVED,
      quantityBefore: item.quantity,
      quantityAfter: item.quantity,
      quantityChange: 0,
      reference: reservation._id.toString(),
      notes: `Reserved ${quantity} units. Available: ${item.availableQuantity}`,
    });

    return reservation;
  }

  async confirmReservation(reservationId: string): Promise<void> {
    const reservation = await InventoryReservation.findById(reservationId);
    if (!reservation) throw new NotFoundError('Reservation not found.');

    const item = await InventoryItem.findOne({
      product: reservation.product, variant: reservation.variant, warehouse: reservation.warehouse,
    });
    if (item) {
      item.quantity -= reservation.quantity;
      item.reservedQuantity -= reservation.quantity;
      item.availableQuantity = item.quantity - item.reservedQuantity;
      await item.save();
    }

    reservation.status = ReservationStatus.CONFIRMED;
    await reservation.save();
  }

  async releaseReservation(reservationId: string): Promise<void> {
    const reservation = await InventoryReservation.findById(reservationId);
    if (!reservation) throw new NotFoundError('Reservation not found.');

    const item = await InventoryItem.findOne({
      product: reservation.product, variant: reservation.variant, warehouse: reservation.warehouse,
    });
    if (item) {
      item.reservedQuantity -= reservation.quantity;
      item.availableQuantity = item.quantity - item.reservedQuantity;
      await item.save();
    }

    reservation.status = ReservationStatus.CANCELLED;
    await reservation.save();
  }

  async releaseExpiredReservations(): Promise<number> {
    const expired = await InventoryReservation.find({
      status: ReservationStatus.ACTIVE,
      expiresAt: { $lte: new Date() },
    });

    for (const reservation of expired) {
      const item = await InventoryItem.findOne({
        product: reservation.product, variant: reservation.variant, warehouse: reservation.warehouse,
      });
      if (item) {
        item.reservedQuantity -= reservation.quantity;
        item.availableQuantity = item.quantity - item.reservedQuantity;
        await item.save();
      }
      reservation.status = ReservationStatus.EXPIRED;
      await reservation.save();
    }

    if (expired.length > 0) {
      logger.info(`Released ${expired.length} expired reservations`);
    }
    return expired.length;
  }

  // --- Audit Log ---

  async getAuditLog(query: {
    page: number; limit: number; productId?: string; warehouseId?: string;
    changeType?: string; fromDate?: string; toDate?: string;
  }): Promise<{ data: any[]; total: number }> {
    const filter: any = {};
    if (query.productId) filter.product = query.productId;
    if (query.warehouseId) filter.warehouse = query.warehouseId;
    if (query.changeType) filter.changeType = query.changeType;
    if (query.fromDate || query.toDate) {
      filter.createdAt = {};
      if (query.fromDate) filter.createdAt.$gte = new Date(query.fromDate);
      if (query.toDate) filter.createdAt.$lte = new Date(query.toDate);
    }

    const [data, total] = await Promise.all([
      InventoryAuditLog.find(filter)
        .populate('product', 'name slug')
        .populate('warehouse', 'name code')
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      InventoryAuditLog.countDocuments(filter),
    ]);
    return { data, total };
  }

  // --- Dashboard ---

  async getDashboard(): Promise<any> {
    const [totalWarehouses, totalItems, lowStockItems, recentTransfers] = await Promise.all([
      Warehouse.countDocuments({ status: 'active' }),
      InventoryItem.aggregate([
        { $group: { _id: null, totalQuantity: { $sum: '$quantity' }, totalReserved: { $sum: '$reservedQuantity' } } },
      ]),
      InventoryItem.countDocuments({ $expr: { $lte: ['$availableQuantity', '$lowStockThreshold'] } }),
      InventoryTransfer.find({ status: TransferStatus.PENDING }).sort({ createdAt: -1 }).limit(10).populate('fromWarehouse', 'name code').populate('toWarehouse', 'name code'),
    ]);

    return {
      totalWarehouses,
      totalStock: totalItems[0]?.totalQuantity || 0,
      totalReserved: totalItems[0]?.totalReserved || 0,
      lowStockItems,
      pendingTransfers: recentTransfers,
    };
  }
}

export const inventoryService = new InventoryService();
