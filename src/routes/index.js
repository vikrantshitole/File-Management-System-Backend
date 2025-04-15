import express from 'express';
import folderRoutes from './folderRoutes.js';

const router = express.Router();

// Folder routes
router.use('/folders', folderRoutes);


export default router; 