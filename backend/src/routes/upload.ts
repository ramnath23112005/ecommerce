import { Router } from 'express';
import { uploadSingle, uploadMultiple } from '../controllers/UploadController';
import { protect } from '../middleware/auth';
import { upload } from '../utils/upload';

const router = Router();

router.use(protect);

router.post('/single', upload.single('file'), uploadSingle);
router.post('/multiple', upload.array('files', 10), uploadMultiple);

export default router;
