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

  try {
    // Build filter conditions
    const filterConditions = [];
    const filterParams = [];

    if (name) {
      filterConditions.push('ft.name LIKE ?');
      filterParams.push(`%${name}%`);
    }
    if (description) {
      filterConditions.push('ft.description LIKE ?');
      filterParams.push(`%${description}%`);
    }
    if (created_at_start) {
      filterConditions.push('ft.created_at >= ?');
      filterParams.push(created_at_start);
    }
    if (created_at_end) {
      filterConditions.push('ft.created_at <= ?');
      filterParams.push(created_at_end);
    }

    const whereClause = filterConditions.length > 0 
      ? `WHERE ${filterConditions.join(' AND ')}` 
      : '';

    // Get root folders and files with filters
    const rootQuery = db.raw(`
      WITH RECURSIVE folder_tree AS (
        -- Base case: root folders
        SELECT 
          id, 
          name, 
          parent_id, 
          description, 
          created_at,
          updated_at,
          'folder' as type,
          1 as level,
          CAST(id AS CHAR(200)) as path
        FROM folders 
        WHERE parent_id IS NULL
        
        UNION ALL
        
        -- Recursive case: subfolders
        SELECT 
          f.id, 
          f.name, 
          f.parent_id, 
          f.description, 
          f.created_at,
          f.updated_at,
          'folder' as type,
          ft.level + 1,
          CONCAT(ft.path, ',', f.id) as path
        FROM folders f
        INNER JOIN folder_tree ft ON f.parent_id = ft.id
      ),
      
      -- Get all files with filters
      all_files AS (
        SELECT 
          id,
          name,
          folder_id as parent_id,
          description,
          created_at,
          updated_at,
          'file' as type,
          1 as level,
          CAST(folder_id AS CHAR(200)) as path,
          file_path
        FROM files
        ${whereClause.replace('ft.', 'files.')}
      ),
      
      -- Get folder counts
      folder_counts AS (
        SELECT 
          parent_id,
          COUNT(*) as subfolder_count
        FROM folders
        GROUP BY parent_id
      ),
      
      -- Get file counts
      file_counts AS (
        SELECT 
          folder_id,
          COUNT(*) as file_count
        FROM files
        GROUP BY folder_id
      ),
      
      -- Get total counts
      total_counts AS (
        SELECT 
          SUM(CASE WHEN type = 'folder' THEN 1 ELSE 0 END) as total_folders,
          SUM(CASE WHEN type = 'file' THEN 1 ELSE 0 END) as total_files
        FROM (
          SELECT 'folder' as type FROM folder_tree
          ${whereClause}
          UNION ALL
          SELECT 'file' as type FROM files
          ${whereClause.replace('ft.', 'files.')}
        ) as combined
      ),
      
      -- Get root level items (for pagination)
      root_items AS (
        SELECT 
          r.id,
          r.name,
          r.parent_id,
          r.description,
          r.created_at,
          r.updated_at,
          r.type,
          r.level,
          r.path,
          r.file_path,
          COALESCE(fc.subfolder_count, 0) as subfolder_count,
          COALESCE(flc.file_count, 0) as file_count,
          ROW_NUMBER() OVER (ORDER BY ${validatedSortBy} ${validatedSortOrder}) as row_num
        FROM (
          SELECT 
            ft.id,
            ft.name,
            ft.parent_id,
            ft.description,
            ft.created_at,
            ft.updated_at,
            ft.type,
            ft.level,
            ft.path,
            NULL as file_path
          FROM folder_tree ft 
          WHERE ft.parent_id IS NULL
          UNION ALL
          SELECT 
            af.id,
            af.name,
            af.parent_id,
            af.description,
            af.created_at,
            af.updated_at,
            af.type,
            af.level,
            af.path,
            af.file_path
          FROM all_files af 
          WHERE af.parent_id IS NULL
        ) as r
        LEFT JOIN folder_counts fc ON r.id = fc.parent_id
        LEFT JOIN file_counts flc ON r.id = flc.folder_id
        ${whereClause}
      ),
      
      -- Get paginated root items
      paginated_roots AS (
        SELECT 
          id,
          name,
          parent_id,
          description,
          created_at,
          updated_at,
          type,
          level,
          path,
          file_path,
          subfolder_count,
          file_count
        FROM root_items
        WHERE row_num > ? AND row_num <= ?
      ),
      
      -- Get all nested items for the paginated roots
      nested_items AS (
        -- Get all subfolders for the paginated root folders
        SELECT DISTINCT
          ft.id,
          ft.name,
          ft.parent_id,
          ft.description,
          ft.created_at,
          ft.updated_at,
          ft.type,
          ft.level,
          ft.path,
          NULL as file_path,
          COALESCE(fc.subfolder_count, 0) as subfolder_count,
          COALESCE(flc.file_count, 0) as file_count
        FROM folder_tree ft
        INNER JOIN paginated_roots pr ON 
          ft.path LIKE CONCAT(pr.path, '%') 
          AND ft.id != pr.id
        LEFT JOIN folder_counts fc ON ft.id = fc.parent_id
        LEFT JOIN file_counts flc ON ft.id = flc.folder_id
        ${whereClause}
        
        UNION ALL
        
        -- Get all files for the paginated root folders
        SELECT DISTINCT
          af.id,
          af.name,
          af.parent_id,
          af.description,
          af.created_at,
          af.updated_at,
          af.type,
          af.level,
          af.path,
          af.file_path,
          0 as subfolder_count,
          0 as file_count
        FROM all_files af
        INNER JOIN paginated_roots pr ON 
          af.parent_id = pr.id
          OR af.parent_id IN (
            SELECT id FROM folder_tree ft 
            WHERE ft.path LIKE CONCAT(pr.path, '%')
          )
      )
      
      -- Combine paginated roots with their nested items
      SELECT 
        fr.id,
        fr.name,
        fr.parent_id,
        fr.description,
        fr.created_at,
        fr.updated_at,
        fr.type,
        fr.level,
        fr.path,
        fr.file_path,
        fr.subfolder_count,
        fr.file_count
      FROM (
        SELECT 
          pr.id,
          pr.name,
          pr.parent_id,
          pr.description,
          pr.created_at,
          pr.updated_at,
          pr.type,
          pr.level,
          pr.path,
          pr.file_path,
          pr.subfolder_count,
          pr.file_count
        FROM paginated_roots pr
        UNION ALL
        SELECT 
          ni.id,
          ni.name,
          ni.parent_id,
          ni.description,
          ni.created_at,
          ni.updated_at,
          ni.type,
          ni.level,
          ni.path,
          ni.file_path,
          ni.subfolder_count,
          ni.file_count
        FROM nested_items ni
      ) as fr
      ORDER BY 
        CASE WHEN fr.parent_id IS NULL THEN 0 ELSE 1 END,
        ${validatedSortBy} ${validatedSortOrder}
    `, [offset, offset + limit]);

    // Get total count with filters
    const totalCountQuery = db.raw(`
      SELECT 
        COUNT(*) as total,
        (SELECT COUNT(*) FROM folders WHERE parent_id IS NULL ${whereClause}) as total_folders,
        (SELECT COUNT(*) FROM files WHERE folder_id IS NULL ${whereClause.replace('ft.', 'files.')}) as total_files
      FROM (
        SELECT id FROM folders WHERE parent_id IS NULL
        ${whereClause}
        UNION ALL
        SELECT id FROM files WHERE folder_id IS NULL
        ${whereClause.replace('ft.', 'files.')}
      ) as root_items
    `, filterParams);

    const [rootItems, totalCountResult] = await Promise.all([
      rootQuery,
      totalCountQuery
    ]);

    const total = parseInt(totalCountResult[0][0].total);
    const totalFolders = parseInt(totalCountResult[0][0].total_folders);
    const totalFiles = parseInt(totalCountResult[0][0].total_files);

    // Build the hierarchical structure
    const buildHierarchy = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => {
          if (item.type === 'folder') {
            return {
              ...item,
              children: buildHierarchy(items, item.id)
            };
          } else {
            return {
              ...item,
              children: []
            };
          }
        });
    };

    const hierarchy = buildHierarchy(rootItems[0]);

    return {
      data: hierarchy,
      counts: {
        total_folders: totalFolders,
        total_files: totalFiles
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error in getHierarchicalContent:', error);
    throw error;
  }
};

/**
 * Update a folder
 * @param {number} id - Folder ID
 * @param {Object} data - Folder data to update
 * @returns {Promise<Object>} Updated folder
 */
export const updateFolder = async (id, data) => {
  try {
    await db('folders')
      .where('id', id)
      .update(data)
      

    const folder = await db('folders')
      .where('id', id)
      .first();

    return folder;
  } catch (error) {
    console.error('Error updating folder:', error);
    throw error;
  }
};

const checkFolderExists = async (id) => {
  const existingFolder = await db('folders').where('id', id).first();
  if (!existingFolder) {
    return new Error({ error: 'Folder not found' });
  }
  return existingFolder;
}

const checkParentFolderExists = async (parent_id) => {
  const existingParentFolder = await db('folders').where('id', parent_id).first();
  if (!existingParentFolder) {
    return new Error({ error: 'Parent folder not found' });
  }
  return existingParentFolder;
}

const checkDuplicateFolderName = async (name, parent_id) => {
  const existingFolder = await db('folders').where('name', name).where('parent_id', parent_id).first();
  if (existingFolder) {
    return new Error({ error: 'A folder with this name already exists in the same location' });
  }
  return existingFolder;
} 
export  {
  createFolder,
  getFolderById,
  getFolderHierarchy,
  checkFolderExists,
  checkParentFolderExists,
  checkDuplicateFolderName
};