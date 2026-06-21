import { Request, Response, NextFunction } from 'express';
import { sellerService } from '../services/SellerService';
import { AuthRequest } from '../middleware/auth';

export const requestSellerAccount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await sellerService.requestSellerAccount(req.user._id.toString(), req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const getSellerProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await sellerService.getSellerProfile(req.user._id.toString());
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const updateSellerProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await sellerService.updateSellerProfile(req.user._id.toString(), req.body);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const getSellerDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dashboard = await sellerService.getSellerDashboard(req.user._id.toString());
    res.json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
};

export const getStorefront = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const storefront = await sellerService.getSellerStorefront(req.user._id.toString());
    res.json({ success: true, data: storefront });
  } catch (error) {
    next(error);
  }
};

export const updateStorefront = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const storefront = await sellerService.updateStorefront(req.user._id.toString(), req.body);
    res.json({ success: true, data: storefront });
  } catch (error) {
    next(error);
  }
};

export const getBankAccounts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accounts = await sellerService.getBankAccounts(req.user._id.toString());
    res.json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
};

export const addBankAccount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const account = await sellerService.addBankAccount(req.user._id.toString(), req.body);
    res.status(201).json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
};

export const deleteBankAccount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await sellerService.deleteBankAccount(req.user._id.toString(), req.params.accountId);
    res.json({ success: true, message: 'Bank account deleted.' });
  } catch (error) {
    next(error);
  }
};

export const getPayoutHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const result = await sellerService.getPayoutHistory(req.user._id.toString(), { page, limit, status });
    const totalPages = Math.ceil(result.total / limit);
    res.json({
      success: true,
      data: result.data,
      pagination: { page, limit, total: result.total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicStore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const store = await sellerService.getPublicStore(req.params.slug);
    res.json({ success: true, data: store });
  } catch (error) {
    next(error);
  }
};

export const getSellersForAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = parseInt(req.query.sortOrder as string) || -1;
    const result = await sellerService.getSellersForAdmin({ page, limit, status, search, sortBy, sortOrder });
    const totalPages = Math.ceil(result.total / limit);
    res.json({
      success: true,
      data: result.data,
      pagination: { page, limit, total: result.total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
  } catch (error) {
    next(error);
  }
};

export const approveSeller = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await sellerService.approveSeller(req.params.id, (req as any).user._id.toString());
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const rejectSeller = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reason } = req.body;
    if (!reason) {
      res.status(400).json({ success: false, error: 'Rejection reason is required.' });
      return;
    }
    const profile = await sellerService.rejectSeller(req.params.id, (req as any).user._id.toString(), reason);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const suspendSeller = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reason } = req.body;
    if (!reason) {
      res.status(400).json({ success: false, error: 'Suspension reason is required.' });
      return;
    }
    const profile = await sellerService.suspendSeller(req.params.id, (req as any).user._id.toString(), reason);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const reinstateSeller = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await sellerService.reinstateSeller(req.params.id, (req as any).user._id.toString());
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const getCommissionRules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const isGlobal = req.query.isGlobal === 'true' ? true : req.query.isGlobal === 'false' ? false : undefined;
    const result = await sellerService.getCommissionRules({ page, limit, isGlobal });
    const totalPages = Math.ceil(result.total / limit);
    res.json({
      success: true,
      data: result.data,
      pagination: { page, limit, total: result.total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
  } catch (error) {
    next(error);
  }
};

export const createCommissionRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rule = await sellerService.createCommissionRule(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};
