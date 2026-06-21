import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/InventoryService';
import { AuthRequest } from '../middleware/auth';

export const createWarehouse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const warehouse = await inventoryService.createWarehouse(req.body);
    res.status(201).json({ success: true, data: warehouse });
  } catch (error) { next(error); }
};

export const updateWarehouse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const warehouse = await inventoryService.updateWarehouse(req.params.id, req.body);
    res.json({ success: true, data: warehouse });
  } catch (error) { next(error); }
};

export const getWarehouses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const result = await inventoryService.getWarehouses({ page, limit, status });
    const totalPages = Math.ceil(result.total / limit);
    res.json({
      success: true, data: result.data,
      pagination: { page, limit, total: result.total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
  } catch (error) { next(error); }
};

export const getWarehouseById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const warehouse = await inventoryService.getWarehouseById(req.params.id);
    res.json({ success: true, data: warehouse });
  } catch (error) { next(error); }
};

export const getInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const warehouseId = req.query.warehouseId as string;
    const productId = req.query.productId as string;
    const lowStock = req.query.lowStock === 'true';
    const search = req.query.search as string;
    const result = await inventoryService.getInventory({ page, limit, warehouseId, productId, lowStock, search });
    const totalPages = Math.ceil(result.total / limit);
    res.json({
      success: true, data: result.data,
      pagination: { page, limit, total: result.total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
  } catch (error) { next(error); }
};

export const adjustStock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId, variantId, warehouseId, quantity, notes } = req.body;
    const item = await inventoryService.adjustStock(productId, variantId, warehouseId, quantity, req.user._id.toString(), notes);
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};

export const createTransfer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transfer = await inventoryService.createTransfer({
      ...req.body,
      initiatedBy: req.user._id.toString(),
    });
    res.status(201).json({ success: true, data: transfer });
  } catch (error) { next(error); }
};

export const approveTransfer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transfer = await inventoryService.approveTransfer(req.params.id, req.user._id.toString());
    res.json({ success: true, data: transfer });
  } catch (error) { next(error); }
};

export const cancelTransfer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transfer = await inventoryService.cancelTransfer(req.params.id);
    res.json({ success: true, data: transfer });
  } catch (error) { next(error); }
};

export const getTransfers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const warehouseId = req.query.warehouseId as string;
    const result = await inventoryService.getTransfers({ page, limit, status, warehouseId });
    const totalPages = Math.ceil(result.total / limit);
    res.json({
      success: true, data: result.data,
      pagination: { page, limit, total: result.total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
  } catch (error) { next(error); }
};

export const getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dashboard = await inventoryService.getDashboard();
    res.json({ success: true, data: dashboard });
  } catch (error) { next(error); }
};

export const reserveStock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId, variantId, warehouseId, quantity, orderId, ttlMinutes } = req.body;
    const reservation = await inventoryService.reserveStock(productId, variantId, warehouseId, quantity, orderId, ttlMinutes);
    res.status(201).json({ success: true, data: reservation });
  } catch (error) { next(error); }
};

export const confirmReservation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await inventoryService.confirmReservation(req.params.id);
    res.json({ success: true, message: 'Reservation confirmed.' });
  } catch (error) { next(error); }
};

export const releaseReservation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await inventoryService.releaseReservation(req.params.id);
    res.json({ success: true, message: 'Reservation released.' });
  } catch (error) { next(error); }
};

export const getAuditLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const productId = req.query.productId as string;
    const warehouseId = req.query.warehouseId as string;
    const changeType = req.query.changeType as string;
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;
    const result = await inventoryService.getAuditLog({ page, limit, productId, warehouseId, changeType, fromDate, toDate });
    const totalPages = Math.ceil(result.total / limit);
    res.json({
      success: true, data: result.data,
      pagination: { page, limit, total: result.total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
  } catch (error) { next(error); }
};
