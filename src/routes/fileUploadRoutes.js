import express from 'express';
import {
  uploadFile,
  getUploadProgress,
  deleteFileHandler,
} from '../controllers/fileUploadController.js';
import { validateDeleteFile, validateUploadId } from '../middleware/folderValidation.js';

const router = express.Router();

router.post('/upload', uploadFile);

router.get('/progress/:uploadId', validateUploadId, getUploadProgress);

router.delete('/:id', validateDeleteFile, deleteFileHandler);

export default router;
