import { createFolder, getFolderHierarchy, getFolderById, updateFolder, checkFolderExists, checkParentFolderExists, checkDuplicateFolderName, deleteFolder } from '../services/folderService.js';

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
const getFolderHierarchyHandler = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      name,
      description,
      date,
      sort_by,
      sort_order
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      name,
      description,
      date,
      sort_by,
      sort_order
    };
        
    const result = await getFolderHierarchy(options);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      counts: result.counts,
    });
  } catch (error) {
    console.error('Error in getHierarchicalContentHandler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Update a folder
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateFolderHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id } = req.body;

    // Check if folder exists
    await checkFolderExists(id);
    // Check if parent folder exists if parent_id is provided
    await checkParentFolderExists(parent_id);
    // Check for duplicate name in the same parent
    await checkDuplicateFolderName(name, parent_id);
    // Update the folder
    const updatedFolder = await updateFolder(id, {
      name,
      description,
      parent_id,
      updated_at: new Date()
    });

    res.json({
      success: true,
      data: updatedFolder
    });
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a folder and its contents
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteFolderHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteFolder(id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in deleteFolderHandler:', error);
    if (error.message === 'Folder not found') {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

export {
  createFolderHandler,
  getFolderHierarchyHandler,
  updateFolderHandler,
  deleteFolderHandler
};
