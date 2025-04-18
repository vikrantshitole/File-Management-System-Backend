import express from 'express';
import { createFolderHandler, getFolderHierarchyHandler,  } from '../controllers/folderController.js';
import { validateCreateFolder } from '../middleware/folderValidation.js';

const router = express.Router();

// Create a new folder
router.post('/create', validateCreateFolder, createFolderHandler);

// Get a folder by ID
// router.get('/:id', validateFolderId, getFolderByIdHandler);

// Get all folders and subfolders
// This route will return all folders and subfolders in a tree-like structure
router.get('/',  getFolderHierarchyHandler);

export default router; 