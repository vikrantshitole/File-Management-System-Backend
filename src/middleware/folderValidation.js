/**
 * Validate folder creation request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateCreateFolder = (req, res, next) => {
  const { name = null, parent_id = null, description = null } = req.body;

  // Validate name
  if (!name) {
    return res.status(400).json({
      status: 'error',
      message: 'Folder name is required',
      code: 'FOLDER_NAME_REQUIRED'
    });
  }

  if (name.length < 1 || name.length > 255) {
    return res.status(400).json({
      status: 'error',
      message: 'Folder name must be between 1 and 255 characters',
      code: 'INVALID_FOLDER_NAME_LENGTH'
    });
  }

  const nameRegex = /^[a-zA-Z0-9\s\-_\.]+$/;
  if (!nameRegex.test(name)) {
    return res.status(400).json({
      status: 'error',
      message: 'Folder name can only contain letters, numbers, spaces, and the following special characters: - _ .',
      code: 'INVALID_FOLDER_NAME_FORMAT'
    });
  }

  // Validate description
  if (description !== null && description !== undefined) {
    if (description.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Folder description cannot be empty',
        code: 'EMPTY_FOLDER_DESCRIPTION'
      });
    }

    if (description.length > 1000) {
      return res.status(400).json({
        status: 'error',
        message: 'Folder description must not exceed 1000 characters',
        code: 'INVALID_FOLDER_DESCRIPTION_LENGTH'
      });
    }
  }

  // Validate parent_id
  if (parent_id !== undefined && parent_id !== null) {
    const parentIdNum = Number(parent_id);
    if (isNaN(parentIdNum) || parentIdNum < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Parent folder ID must be a positive number',
        code: 'INVALID_PARENT_ID'
      });
    }
    req.body.parent_id = parentIdNum;
  }

  next();
};

/**
 * Validate folder ID parameter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateFolderId = (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      status: 'error',
      message: 'Folder ID is required',
      code: 'FOLDER_ID_REQUIRED'
    });
  }

  const folderId = Number(id);
  
  if (isNaN(folderId)) {
    return res.status(400).json({
      status: 'error',
      message: 'Folder ID must be a number',
      code: 'INVALID_FOLDER_ID_FORMAT'
    });
  }

  if (!Number.isInteger(folderId) || folderId < 1) {
    return res.status(400).json({
      status: 'error',
      message: 'Folder ID must be a positive integer',
      code: 'INVALID_FOLDER_ID_VALUE'
    });
  }

  req.params.id = folderId;
  next();
};

export {
  validateCreateFolder,
  validateFolderId
}; 