import { Router } from 'express';
import {
  requestSellerAccount, getSellerProfile, updateSellerProfile, getSellerDashboard,
  getStorefront, updateStorefront,
  getBankAccounts, addBankAccount, deleteBankAccount, getPayoutHistory,
  getPublicStore,
} from '../controllers/SellerController';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/enums';

const router = Router();

// Public
router.get('/store/:slug', getPublicStore);

// Protected - any logged-in user
router.use(protect);
router.post('/request', requestSellerAccount);
router.get('/profile', getSellerProfile);
router.put('/profile', updateSellerProfile);
router.get('/dashboard', getSellerDashboard);
router.get('/storefront', getStorefront);
router.put('/storefront', updateStorefront);
router.get('/bank-accounts', getBankAccounts);
router.post('/bank-accounts', addBankAccount);
router.delete('/bank-accounts/:accountId', deleteBankAccount);
router.get('/payouts', getPayoutHistory);

export default router;
