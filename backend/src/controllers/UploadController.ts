import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { IAPIResponse } from '../../../shared/types';
import { uploadToCloudinary, uploadMultipleToCloudinary } from '../utils/cloudinaryUpload';

export const uploadSingle = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const url = await uploadToCloudinary(req.file.path);
    res.json({ success: true, data: { url, filename: req.file.filename } });
  } catch (error) {
    next(error);
  }
};

export const uploadMultiple = async (req: AuthRequest, res: Response<IAPIResponse>, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ success: false, message: 'No files uploaded' });

    const paths = files.map((f) => f.path);
    const urls = await uploadMultipleToCloudinary(paths);
    res.json({ success: true, data: urls });
  } catch (error) {
    next(error);
  }
};
