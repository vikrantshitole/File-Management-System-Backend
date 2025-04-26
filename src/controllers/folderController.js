import {
  createFolder,
  getFolderHierarchy,
  updateFolder,
  checkFolderExists,
  checkParentFolderExists,
  checkDuplicateFolderName,
  deleteFolder,
} from '../services/folderService.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new folder
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createFolderHandler = async (req, res, next) => {
  try {
    const { name, description, parent_id } = req.body;

    logger.debug(`Creating folder: ${name}, description: ${description}, parent_id: ${parent_id}`);

    const folder = await createFolder(req.body);

    res.status(201).json(folder);
  } catch (error) {
    // Handle specific error cases
    if (error.message === 'Parent folder not found') {
      // 404 Not Found: Folder does not exis
      logger.error(`Parent folder not found: ${error.message}`);
      return next({
        ...error,
        statusCode: 404,
        status: 'error',
        message: error.message,
        code: 'PARENT_FOLDER_NOT_FOUND',
      });
    }

    if (error.message === 'A folder with this name already exists in the same location') {
      // 409 Conflict: Duplicate record detected
      logger.error(`Duplicate folder name: ${error.message}`);
      return next({
        ...error,
        status: 'error',
        message: error.message,
        statusCode: 409,
        code: 'FOLDER_ALREADY_EXISTS',
      });
    }

    // Handle unexpected errors
    logger.error('Error creating folder:', error);
    next({
      ...error,
      statusCode: 500,
      status: 'error',
      message: 'An unexpected error occurred while creating the folder',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Get a folder by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getFolderHierarchyHandler = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, name, description, date, sort_by, sort_order } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      name,
      description,
      date,
      sort_by,
      sort_order,
    };

    logger.debug(`Retrieving folder hierarchy with options: ${JSON.stringify(options)}`);

    const result = await getFolderHierarchy(options);

    logger.info(`Retrieved folder hierarchy with ${result.data.length} root folders`);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      counts: result.counts,
    });
  } catch (error) {
    logger.error('Error getting folder hierarchy:', error);
    next({
      ...error,
      statusCode: 500,
      status: 'error',
      message: 'An unexpected error occurred while getting the folder hierarchy',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Update a folder
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateFolderHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id = null } = req.body;

    logger.debug(
      `Updating folder with ID: ${id}, name: ${name}, description: ${description}, parent_id: ${parent_id}`
    );

    await checkFolderExists(id);

    logger.debug(`Checking if parent folder exists: ${parent_id}`);
    if (parent_id) {
      await checkParentFolderExists(parent_id);
    }

    logger.debug(`Checking for duplicate folder name: ${name}`);
    await checkDuplicateFolderName(name, parent_id, id);

    logger.debug(`Updating folder: ${id}`);
    // Update the folder

    const updatedFolder = await updateFolder(id, {
      name,
      description,
      updated_at: new Date(),
    });

    logger.info(`Folder Updated Successfully: ${updatedFolder.id}`);
    res.json({
      success: true,
      data: updatedFolder,
    });
  } catch (error) {
    if (error.message === 'Parent folder not found') {
      // 404 Not Found: Folder does not exist
      logger.error(`Parent folder not found: ${error.message}`);
      return next({
        ...error,
        statusCode: 404,
        status: 'error',
        message: error.message,
        code: 'PARENT_FOLDER_NOT_FOUND',
      });
    }

    if (error.message === 'A folder with this name already exists in the same location') {
      // 409 Conflict: Duplicate record detected
      logger.error(`Duplicate folder name: ${error.message}`);
      return next({
        ...error,
        status: 'error',
        message: error.message,
        statusCode: 409,
        code: 'FOLDER_ALREADY_EXISTS',
      });
    }
    logger.error('Error updating folder:', error);
    next({
      ...error,
      statusCode: 500,
      status: 'error',
      message: 'An unexpected error occurred while updating the folder',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};

/**
 * Delete a folder and its contents
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteFolderHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.debug(`Deleting folder with ID: ${id}`);
    const result = await deleteFolder(id);
    logger.info(`Folder deleted successfully: ${id}`);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message === 'Folder not found') {
      logger.error(`Folder not found: ${error.message}`);
      return next({
        ...error,
        statusCode: 404,
        status: 'error',
        message: error.message,
        code: 'FOLDER_NOT_FOUND',
      });
    }

    logger.error('Error in deleteFolderHandler:', error);
    next({
      ...error,
      statusCode: 500,
      status: 'error',
      message: 'An unexpected error occurred while deleting the folder',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};
