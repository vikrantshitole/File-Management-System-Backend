import db from '../config/database.js';

/**
 * Create a new folder
 * @param {Object} folderData - Folder data
 * @param {string} folderData.name - Folder name
 * @param {number} [folderData.parent_id] - Parent folder ID
 * @returns {Promise<Object>} Created folder
 */
const createFolder = async (folderData) => {
  const { name, parent_id } = folderData;

  // If parent_id is provided, check if it exists
  if (parent_id) {
    const parentFolder = await db('folders')
      .where('id', parent_id)
      .first();

    if (!parentFolder) {
      throw new Error('Parent folder not found');
    }
  }

  // Check if folder with same name exists in the same parent
  const existingFolder = await db('folders')
    .where({
      name,
      parent_id: parent_id || null
    })
    .first();

  if (existingFolder) {
    throw new Error('A folder with this name already exists in the same location');
  }

  // Create the folder
  const [folderId] = await db('folders')
    .insert({
      name,
      parent_id
    });
    
  // Fetch the created folder
  const folder = await db('folders')
    .where('id', folderId)
    .first();

  return folder;
};

/**
 * Get a folder by ID
 * @param {number} id - Folder ID
 * @returns {Promise<Object>} Folder
 */
const getFolderById = async (id) => {
  const folder = await db('folders')
    .where('id', id)
    .first();

  if (!folder) {
    throw new Error('Folder not found');
  }

  return folder;
};

export {
  createFolder,
  getFolderById
};
