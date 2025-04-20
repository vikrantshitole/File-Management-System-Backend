import express from 'express';
import { uploadFile, getUploadProgress, deleteFileHandler } from '../controllers/fileUploadController.js';

const router = express.Router();

router.post('/upload', uploadFile);

router.get('/progress/:uploadId', getUploadProgress);

router.delete('/:id', deleteFileHandler);

export default router; 