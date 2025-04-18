import express from 'express';
import { uploadFile, getUploadProgress } from '../controllers/fileUploadController.js';

const router = express.Router();

router.post('/upload', uploadFile);

router.get('/progress/:uploadId', getUploadProgress);

export default router; 