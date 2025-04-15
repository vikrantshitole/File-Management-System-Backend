import { createFolder, getFolderById } from '../services/folderService.js';

/**
 * Create a new folder
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createFolderHandler = async (req, res) => {  
  try {
    const folder = await createFolder(req.body);
    res.status(201).json(folder);
  } catch (error) {
    // Handle specific error cases
    if (error.message === 'Parent folder not found') {
      // 404 Not Found: Folder does not exist
      return res.status(404).json({
        status: 'error',
        message: error.message,
        code: 'PARENT_FOLDER_NOT_FOUND'
      });
    }

    if (error.message === 'A folder with this name already exists in the same location') {
      // 409 Conflict: Duplicate record detected
      return res.status(409).json({
        status: 'error',
        message: error.message,
        code: 'FOLDER_ALREADY_EXISTS'
      });
    }

    // Handle unexpected errors
    console.error('Error creating folder:', error);
    res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred while creating the folder',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Get a folder by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFolderByIdHandler = async (req, res) => {
  try {
    const folder = await getFolderById(req.params.id);
    res.json(folder);
  } catch (error) {
    if (error.message === 'Folder not found') {
      return res.status(404).json({
        status: 'error',
        message: error.message,
        code: 'FOLDER_NOT_FOUND'
      });
    }

    console.error('Error getting folder:', error);
    res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred while getting the folder',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

export {
  createFolderHandler,
  getFolderByIdHandler
};
