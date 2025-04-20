import express from 'express';
import { createFolderHandler, getFolderHierarchyHandler, updateFolderHandler, deleteFolderHandler } from '../controllers/folderController.js';
import { validateCreateFolder } from '../middleware/folderValidation.js';

const router = express.Router();


router.post('/create', validateCreateFolder, createFolderHandler);

router.get('/',  getFolderHierarchyHandler);

router.put('/update/:id', validateCreateFolder, updateFolderHandler);

router.delete('/:id', deleteFolderHandler);

export default router; 