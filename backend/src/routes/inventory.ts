import { Router } from 'express';
import {
  createWarehouse, updateWarehouse, getWarehouses, getWarehouseById,
  getInventory, adjustStock,
  createTransfer, approveTransfer, cancelTransfer, getTransfers,
  getDashboard, reserveStock, confirmReservation, releaseReservation, getAuditLog,
} from '../controllers/InventoryController';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/enums';

const router = Router();

router.use(protect);

// Warehouse management (admin only)
router.get('/dashboard', authorize(UserRole.ADMIN), getDashboard);
router.post('/warehouses', authorize(UserRole.ADMIN), createWarehouse);
router.put('/warehouses/:id', authorize(UserRole.ADMIN), updateWarehouse);
router.get('/warehouses', getWarehouses);
router.get('/warehouses/:id', getWarehouseById);

// Inventory items
router.get('/items', getInventory);
router.post('/adjust', authorize(UserRole.ADMIN), adjustStock);

// Stock reservations
router.post('/reserve', reserveStock);
router.put('/reservations/:id/confirm', confirmReservation);
router.put('/reservations/:id/release', releaseReservation);

// Inventory transfers
router.post('/transfers', createTransfer);
router.put('/transfers/:id/approve', approveTransfer);
router.put('/transfers/:id/cancel', cancelTransfer);
router.get('/transfers', getTransfers);

// Audit log
router.get('/audit', authorize(UserRole.ADMIN), getAuditLog);

export default router;
