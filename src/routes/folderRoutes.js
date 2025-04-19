import express from 'express';
import { createFolderHandler, getFolderHierarchyHandler, updateFolderHandler } from '../controllers/folderController.js';
import { validateCreateFolder } from '../middleware/folderValidation.js';

const router = express.Router();

// Create a new folder
router.post('/create', validateCreateFolder, createFolderHandler);

// Get all folders and subfolders
// This route will return all folders and subfolders in a tree-like structure
router.get('/',  getFolderHierarchyHandler);

// Update folder
router.put('/update/:id', validateCreateFolder,updateFolderHandler);

export default router; 