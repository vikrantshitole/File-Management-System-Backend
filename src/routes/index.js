import express from 'express';
import folderRoutes from './folderRoutes.js';
import fileUploadRoutes from './fileUploadRoutes.js';
import authRoutes from './authRoutes.js';
import { authenticateToken } from '../services/jwtService.js';
const router = express.Router();

// Folder routes
router.use('/folders', authenticateToken, folderRoutes);

router.use('/files', authenticateToken, fileUploadRoutes);

router.use('/auth', authRoutes);

export default router;
