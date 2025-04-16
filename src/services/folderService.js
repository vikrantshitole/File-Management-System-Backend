import db from '../config/database.js';
// import { buildFolderTree } from '../utils/index.js';

/**
 * Create a new folder
 * @param {Object} folderData - Folder data
 * @param {string} folderData.name - Folder name
 * @param {number} [folderData.parent_id] - Parent folder ID
 * @returns {Promise<Object>} Created folder
 */
const createFolder = async (folderData) => {
  const { name, parent_id, description } = folderData;

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
      parent_id,
      description
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

/**
 * Get paginated root folders with all their subfolders
 * @param {Object} options - Pagination options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Number of items per page
 * @returns {Promise<Object>} Paginated root folders with their complete subfolder hierarchy
 */
const getFolderHierarchy = async (options = {}) => {
  const { page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;

  // Get paginated root folders and total count in a single query
  const [rootFoldersResult, totalResult] = await Promise.all([
    db('folders')
      .whereNull('parent_id')
      .orderBy('name', 'asc')
      .limit(limit)
      .offset(offset),
    db('folders')
      .whereNull('parent_id')
      .count('* as total')
      .first()
  ]);

  // If no root folders, return empty result early
  if (rootFoldersResult.length === 0) {
    return {
      data: [],
      pagination: {
        total: 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: 0
      }
    };
  }

  const total = parseInt(totalResult.total);
  const rootFolderIds = rootFoldersResult.map(folder => folder.id);
  
  // Get all descendants using an optimized recursive query
  const descendantsResult = await db.raw(`
    WITH RECURSIVE folder_tree AS (
      -- Base case: direct children of root folders
      SELECT id, name, parent_id, description, created_at, updated_at, 1 as level
      FROM folders
      WHERE parent_id IN (?)
      
      UNION ALL
      
      -- Recursive case: children of children
      SELECT f.id, f.name, f.parent_id, f.description, f.created_at, f.updated_at, ft.level + 1
      FROM folders f
      INNER JOIN folder_tree ft ON f.parent_id = ft.id
      WHERE ft.level < 10  -- Limit recursion depth to prevent infinite loops
    )
    SELECT * FROM folder_tree
    ORDER BY name
  `, [rootFolderIds]);
  
  // Extract descendants from the result
  const descendants = descendantsResult[0] || [];
  
  // Combine root folders with descendants
  const allFolders = [...rootFoldersResult, ...descendants];

  // Build folder tree using a Map for O(1) lookups
  const folderMap = new Map();
  
  // Initialize the map with all folders
  allFolders.forEach(folder => {
    folderMap.set(folder.id, { ...folder, sub_folders: [] });
  });
  
  // Add children to their parents
  allFolders.forEach(folder => {
    if (folder.parent_id && folderMap.has(folder.parent_id)) {
      const parent = folderMap.get(folder.parent_id);
      parent.sub_folders.push(folderMap.get(folder.id));
    }
  });
  
  // Get the final tree starting from root folders
  const folderTree = rootFoldersResult.map(rootFolder => folderMap.get(rootFolder.id));

  return {
    data: folderTree,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};

export {
  createFolder,
  getFolderById,
  getFolderHierarchy
};
