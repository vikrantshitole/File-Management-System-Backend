import { logger } from '../utils/logger.js';

export const validateCreateFolder = (req, _, next) => {
  // Check if name is provided
  const validationResult = validateCreateOrUpdateFolder(req, true);
  if (validationResult) {
    return next(validationResult);
  }
  next();
};

/**
 * Validate folder ID parameter
 * @param {Object} req - Express request object
 * @param {Object} _ - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateFolderId = (req, _, next) => {
  const { id } = req.params;

  // Check if ID is provided
  let validationResult = validateId(id, 'Folder ID');
  if (validationResult) {
    return next(validationResult);
  }

  next();
};

export const validateUploadId = (req, _, next) => {
  const { uploadId } = req.params;

  if (!uploadId) {
    logger.warn('Missing uploadId parameter');
    return next({
      status: 'error',
      statusCode: 400,
      message: 'Upload ID is required',
      code: 'UPLOAD_ID_REQUIRED',
    });
  }
  if (!isValidUUID(uploadId)) {
    logger.warn('Invalid uploadId parameter');
    return next({
      status: 'error',
      statusCode: 400,
      message: 'Upload ID must be a valid UUID',
      code: 'INVALID_UPLOAD_ID_FORMAT',
    });
  }
  next();
};

/**
 * Validate query parameters for getFolderHierarchy
 * @param {Object} req - Express request object
 * @param {Object} _ - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateGetFolderHierarchy = (req, _, next) => {
  const { page, limit, name, description, date, sort_by, sort_order } = req.query;

  if (!page) {
    logger.warn('Missing page parameter');
    return next({
      status: 'error',
      statusCode: 400,
      message: 'Page is required',
      code: 'PAGE_PARAMETER_REQUIRED',
    });
  }

  // Validate page
  if (page && (isNaN(page) || parseInt(page) < 1)) {
    logger.warn('Invalid page parameter:', page);
    return next({
      status: 'error',
      statusCode: 400,
      message: 'Page must be a positive number',
      code: 'INVALID_PAGE_PARAMETER',
    });
  }
  if (!limit) {
    logger.warn('Missing limit parameter');
    return next({
      status: 'error',
      statusCode: 400,
      message: 'Limit is required',
      code: 'LIMIT_PARAMETER_REQUIRED',
    });
  }
  // Validate limit
  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    logger.warn('Invalid limit parameter:', limit);
    return next({
      status: 'error',
      statusCode: 400,
      message: 'Limit must be a positive number between 1 and 100',
      code: 'INVALID_LIMIT_PARAMETER',
    });
  }

  // Validate name
  if (name && (typeof name !== 'string' || name.length > 255)) {
    logger.warn('Invalid name parameter:', name);
    return next({
      status: 'error',
      statusCode: 400,
      message: 'Name must be a string with maximum length of 255 characters',
      code: 'INVALID_NAME_PARAMETER',
    });
  }

  // Validate description
  if (description && (typeof description !== 'string' || description.length > 1000)) {
    logger.warn('Invalid description parameter:', description);
    return next({
      status: 'error',
      statusCode: 400,
      message: 'Description must be a string with maximum length of 1000 characters',
      code: 'INVALID_DESCRIPTION_PARAMETER',
    });
  }

  // Validate created_at_start
  if (date && !isValidDate(date)) {
    logger.warn('Invalid date parameter:', date);
    return next({
      status: 'error',
      statusCode: 400,
      message: 'date must be a valid date in ISO format',
      code: 'INVALID_DATE_PARAMETER',
    });
  }

  if (!sort_by) {
    logger.warn('Missing sort_by parameter');
    return next({
      status: 'error',
      statusCode: 400,
      message: 'sort_by is required',
      code: 'SORT_BY_PARAMETER_REQUIRED',
    });
  }

  // Validate sort_by
  if (sort_by && !['name', 'created_at', 'updated_at'].includes(sort_by)) {
    logger.warn('Invalid sort_by parameter:', sort_by);
    return next({
      status: 'error',
      statusCode: 400,
      message: 'sort_by must be one of: name, created_at, updated_at',
      code: 'INVALID_SORT_BY_PARAMETER',
    });
  }

  if (!sort_order) {
    logger.warn('Missing sort_order parameter');
    return next({
      status: 'error',
      statusCode: 400,
      message: 'sort_order is required',
      code: 'SORT_ORDER_PARAMETER_REQUIRED',
    });
  }

  // Validate sort_order
  if (sort_order && !['asc', 'desc'].includes(sort_order.toLowerCase())) {
    logger.warn('Invalid sort_order parameter:', sort_order);
    return next({
      status: 'error',
      statusCode: 400,
      message: 'sort_order must be either asc or desc',
      code: 'INVALID_SORT_ORDER_PARAMETER',
    });
  }

  next();
};

/**
 * Validate updateFolder request
 * @param {Object} req - Express request object
 * @param {Object} _ - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateUpdateFolder = (req, _, next) => {
  const { id } = req.params;

  // Validate folder ID
  let validationResult = validateId(id, 'Folder ID');
  if (validationResult) {
    return next(validationResult);
  }

  // Validate name and description
  validationResult = validateCreateOrUpdateFolder(req, false);
  if (validationResult) {
    return next(validationResult);
  }

  next();
};

/**
 * Validate deleteFolder request
 * @param {Object} req - Express request object
 * @param {Object} _ - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateDeleteFolder = (req, _, next) => {
  const { id } = req.params;

  let validationResult = validateId(id, 'Folder ID');
  if (validationResult) {
    return next(validationResult);
  }

  next();
};

/**
 * Validate deleteFolder request
 * @param {Object} req - Express request object
 * @param {Object} _ - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateDeleteFile = (req, _, next) => {
  const { id } = req.params;

  let validationResult = validateId(id, 'File ID');
  if (validationResult) {
    return next(validationResult);
  }

  next();
};

/**
 * Helper function to validate if a string is a valid date
 * @param {string} dateString - The string to validate
 * @returns {boolean} - True if valid date, false otherwise
 */
const isValidDate = dateString => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

const validateCreateOrUpdateFolder = (req, isCreate = false) => {
  const { name, description, parent_id } = req.body;

  if (isCreate && !name.trim()) {
    logger.warn('Missing folder name');
    return {
      status: 'error',
      statusCode: 400,
      message: 'Folder name is required',
      code: 'FOLDER_NAME_REQUIRED',
    };
  }
  if (!isCreate && !name.trim() && !description.trim()) {
    logger.warn('Missing folder name or description');
    return {
      status: 'error',
      statusCode: 400,
      message: 'Folder name or description is required',
      code: 'FOLDER_NAME_OR_DESCRIPTION_REQUIRED',
    };
  }
  // Validate name length
  if (name.length < 1 || name.length > 255) {
    logger.warn('Invalid folder name length');
    return {
      status: 'error',
      statusCode: 400,
      message: 'Folder name must be between 1 and 255 characters',
      code: 'INVALID_FOLDER_NAME_LENGTH',
    };
  }

  // Validate name format (alphanumeric, spaces, and common special characters)
  const nameRegex = /^[a-zA-Z0-9\s\-_\.]+$/;
  if (!nameRegex.test(name)) {
    logger.warn('Invalid folder name format');
    return {
      status: 'error',
      statusCode: 400,
      message:
        'Folder name can only contain letters, numbers, spaces, and the following special characters: - _ .',
      code: 'INVALID_FOLDER_NAME_FORMAT',
    };
  }

  // Check if description is empty or only whitespace
  if (isCreate && (!description || description.trim() === '')) {
    logger.warn('Invalid folder description');
    return {
      status: 'error',
      statusCode: 400,
      message: 'Folder description cannot be empty',
      code: 'EMPTY_FOLDER_DESCRIPTION',
    };
  }

  // Validate description if provided
  if (description !== null && description !== undefined) {
    // Validate description length
    if (description.length > 1000) {
      logger.warn('Invalid folder description length');
      return {
        status: 'error',
        message: 'Folder description must not exceed 1000 characters',
        code: 'INVALID_FOLDER_DESCRIPTION_LENGTH',
      };
    }
  }

  // If parent_id is provided, validate it's a number
  if (parent_id !== undefined && parent_id !== null) {
    if (!isValidUUID(parent_id)) {
      logger.warn('Invalid parent folder ID');
      return {
        status: 'error',
        statusCode: 400,
        message: 'Parent folder ID must be a valid UUID',
        code: 'INVALID_PARENT_ID',
      };
    }
  }
  return;
};

const validateId = (id, field_name) => {
  // / Validate folder ID
  if (!id) {
    logger.warn(`Missing ${field_name}`);
    return {
      status: 'error',
      statusCode: 400,
      message: `${field_name} is required`,
      code: 'FOLDER_ID_REQUIRED',
    };
  }

  // Check if ID is a valid number
  if (!isValidUUID(id)) {
    logger.warn(`Invalid ${field_name} format`);
    return {
      status: 'error',
      statusCode: 400,
      message: `${field_name} must be a valid UUID`,
      code: 'INVALID_FOLDER_ID_FORMAT',
    };
  }

  return;
};

const isValidUUID = uuid => {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);
};
