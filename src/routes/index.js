import express from 'express';
import folderRoutes from './folderRoutes.js';
import fileUploadRoutes from './fileUploadRoutes.js';

const router = express.Router();

// Folder routes
router.use('/folders', folderRoutes);

router.use('/files', fileUploadRoutes);

export default router;
