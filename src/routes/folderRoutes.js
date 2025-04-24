import express from 'express';
import {
  createFolderHandler,
  getFolderHierarchyHandler,
  updateFolderHandler,
  deleteFolderHandler,
} from '../controllers/folderController.js';
import {
  validateCreateFolder,
  validateDeleteFolder,
  validateGetFolderHierarchy,
  validateUpdateFolder,
} from '../middleware/folderValidation.js';

const router = express.Router();

router.post('/create', validateCreateFolder, createFolderHandler);

router.get('/', validateGetFolderHierarchy, getFolderHierarchyHandler);

router.put('/update/:id', validateUpdateFolder, updateFolderHandler);

router.delete('/:id', validateDeleteFolder, deleteFolderHandler);

export default router;
