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
 * @param {Object} options - Pagination and filter options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Number of items per page
 * @param {string} [options.name] - Filter by folder name (partial match)
 * @param {string} [options.description] - Filter by folder description (partial match)
 * @param {string} [options.created_at_start] - Filter by creation date range start (YYYY-MM-DD)
 * @param {string} [options.created_at_end] - Filter by creation date range end (YYYY-MM-DD)
 * @param {string} [options.sort_by='name'] - Field to sort by (name, created_at, updated_at)
 * @param {string} [options.sort_order='asc'] - Sort order (asc, desc)
 * @returns {Promise<Object>} Paginated root folders with their complete subfolder hierarchy
 */
const getFolderHierarchy = async (options = {}) => {
  const { 
    page = 1, 
    limit = 10,
    name,
    description,
    created_at_start,
    created_at_end,
    sort_by = 'created_at',
    sort_order = 'desc'
  } = options;
  
  const offset = (page - 1) * limit;
  
  // Validate sort parameters
  const validSortFields = ['name', 'created_at', 'updated_at'];
  const validSortOrders = ['asc', 'desc'];
  
  const validatedSortBy = validSortFields.includes(sort_by) ? sort_by : 'name';
  const validatedSortOrder = validSortOrders.includes(sort_order.toLowerCase()) ? sort_order.toLowerCase() : 'asc';

  // Build query for root folders with filters
  const rootFoldersQuery = db('folders').whereNull('parent_id');
  
  // Apply filters if provided
  if (name) {
    rootFoldersQuery.where('name', 'like', `%${name}%`);
  }
  
  if (description) {
    rootFoldersQuery.where('description', 'like', `%${description}%`);
  }
  
  if (created_at_start) {
    rootFoldersQuery.where('created_at', '>=', created_at_start);
  }
  
  if (created_at_end) {
    rootFoldersQuery.where('created_at', '<=', created_at_end + ' 23:59:59');
  }
  
  // Get total count first to handle pagination properly
  const totalResult = await rootFoldersQuery.clone().count('* as total').first();
  const total = totalResult ? parseInt(totalResult.total) : 0;
  
  // Get total files count
  const totalFilesResult = await db('files').count('* as total').first();
  const totalFiles = totalFilesResult ? parseInt(totalFilesResult.total) : 0;

  // Get files count for each folder
  const folderFilesCount = await db('files')
    .select('folder_id')
    .count('* as count')
    .groupBy('folder_id');

  // Create a map of folder_id to file count
  const folderFilesMap = new Map();
  folderFilesCount.forEach(item => {
    folderFilesMap.set(item.folder_id, parseInt(item.count));
  });

  // Get total subfolders count for each folder
  const folderSubfoldersCount = await db('folders')
    .select('parent_id')
    .count('* as count')
    .groupBy('parent_id');

  // Create a map of parent_id to subfolder count
  const folderSubfoldersMap = new Map();
  folderSubfoldersCount.forEach(item => {
    if (item.parent_id) {
      folderSubfoldersMap.set(item.parent_id, parseInt(item.count));
    }
  });
  
  // If no folders match the filters, return empty result early
  if (total === 0) {
    return {
      data: [],
      pagination: {
        total: 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: 0
      },
      counts: {
        totalFolders: 0,
        totalFiles: totalFiles,
        totalItems: totalFiles
      }
    };
  }
  
  // Get paginated root folders
  const rootFoldersResult = await rootFoldersQuery.select('*',db.raw(`'folder' as type`))
    .orderBy(validatedSortBy, validatedSortOrder)
    .limit(limit)
    .offset(offset);

  // If no root folders on this page, return empty result
  if (rootFoldersResult.length === 0) {
    return {
      data: [],
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      counts: {
        totalFolders: total,
        totalFiles: totalFiles,
        totalItems: total + totalFiles
      }
    };
  }

  const rootFolderIds = rootFoldersResult.map(folder => folder.id);
  
  // Get all descendants using an optimized recursive query
  const descendantsResult = await db.raw(`
    WITH RECURSIVE folder_tree AS (
      -- Base case: direct children of root folders
      SELECT id, name, parent_id, description, created_at, updated_at, 1 as level, 'folder' as type
      FROM folders
      WHERE parent_id IN (?)
      
      UNION ALL
      
      -- Recursive case: children of children
      SELECT f.id, f.name, f.parent_id, f.description, f.created_at, f.updated_at, ft.level + 1, 'folder' as type
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
    const fileCount = folderFilesMap.get(folder.id) || 0;
    const subfolderCount = folderSubfoldersMap.get(folder.id) || 0;
    folderMap.set(folder.id, { 
      ...folder, 
      children: [],
      file_count: fileCount,
      subfolder_count: subfolderCount,
      total_items: fileCount + subfolderCount
    });
  });
  
  // Add children to their parents
  allFolders.forEach(folder => {
    if (folder.parent_id && folderMap.has(folder.parent_id)) {
      const parent = folderMap.get(folder.parent_id);
      parent.children.push(folderMap.get(folder.id));
    }
  });
  
  // Get the final tree starting from root folders
  const folderTree = rootFoldersResult.map(rootFolder => folderMap.get(rootFolder.id));

  // Calculate additional statistics
  const totalSubfolders = descendants.length;
  const totalItems = total + totalFiles;

  return {
    data: folderTree,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    },
    counts: {
      totalFolders: total,
      totalFiles: totalFiles,
      totalSubfolders: totalSubfolders,
      totalItems: totalItems,
      rootFolders: rootFoldersResult.length,
      currentPageFolders: allFolders.length
    }
  };
};

export {
  createFolder,
  getFolderById,
  getFolderHierarchy
};
