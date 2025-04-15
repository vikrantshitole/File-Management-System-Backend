import express from 'express';
import { createFolderHandler, getFolderByIdHandler } from '../controllers/folderController.js';
import { validateCreateFolder, validateFolderId } from '../middleware/folderValidation.js';

const router = express.Router();

// Create a new folder
router.post('/create', validateCreateFolder, createFolderHandler);

// Get a folder by ID
router.get('/:id', validateFolderId, getFolderByIdHandler);

export default router; 