import { logger } from '../utils/logger.js';
import Folder from '../models/Folder.js';
import File from '../models/File.js';
import { Op } from 'sequelize';
import sequelize from '../config/sequelize.js';

/**
 * Create a new folder
 * @param {Object} folderData - Folder data
 * @param {string} folderData.name - Folder name
 * @param {number} [folderData.parent_id] - Parent folder ID
 * @returns {Promise<Object>} Created folder
 */
export const createFolder = async folderData => {
  const { name, parent_id = null, description } = folderData;

  if (parent_id) {
    await checkParentFolderExists(parent_id);
  }

  await checkDuplicateFolderName(name, parent_id);

  logger.debug(`Inserting folder into database: ${name}`);

  const folder = await Folder.create({
    name,
    parent_id,
    description,
  });

  logger.info(`Folder created successfully: ${folder.id}`);

  return folder;
};

/**
 * Get a folder by ID
 * @param {number} id - Folder ID
 * @returns {Promise<Object>} Folder
 */
export const getFolderById = async id => {
  logger.debug(`Retrieving folder by ID: ${id}`);

  const folder = await Folder.findByPk(id);

  logger.info(`Retrieved folder: ${folder?.id}`);

  return folder;
};

/**
 * Get paginated root folders with all their subfolders
 * @param {Object} options - Pagination and filter options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Number of items per page
 * @param {string} [options.name] - Filter by folder name (partial match)
 * @param {string} [options.description] - Filter by folder description (partial match)
 * @param {string} [options.sort_by='name'] - Field to sort by (name, created_at, updated_at)
 * @param {string} [options.sort_order='asc'] - Sort order (asc, desc)
 * @returns {Promise<Object>} Paginated root folders with their complete subfolder hierarchy
 */
export async function getFolderHierarchy(options = {}) {
  try {
    const {
      page = 1,
      limit = 10,
      name,
      description,
      date,
      sort_by = 'updated_at',
      sort_order = 'desc',
    } = options;

    // Get all root items from the view
    const rootItems = await getAllRootItems({
      page,
      limit,
      name,
      description,
      sort_by,
      sort_order,
      date,
    });

    const folderIds = rootItems.items.filter(item => item.type === 'folder').map(item => item.id);
    const fileIds = rootItems.items.filter(item => item.type === 'file').map(item => item.id);

    const [folders, files, folderCount, fileCount] = await Promise.all([
      Folder.findAll({
        where: { id: { [Op.in]: folderIds } },
        hierarchy: true,
      }),
      File.findAll({
        where: { id: { [Op.in]: fileIds } },
      }),
      Folder.count({ where: { parent_id: null } }),
      File.count({ where: { folder_id: null } }),
    ]);
    // Apply sorting
    let fullTree = await Promise.all(folders.map(folder => folder.getDescendants()));
    const folderMap = new Map(fullTree.map(f => [f.id, f]));
    const fileMap = new Map(files.map(f => [f.id, f]));

    // Construct items list in order
    const items = rootItems.items
      .map(element => {
        if (element.type === 'folder') {
          const folder = folderMap.get(element.id);
          return folder ? { ...folder, type: 'folder' } : null;
        } else if (element.type === 'file') {
          const file = fileMap.get(element.id);
          return file ? { ...file.toJSON(), type: 'file', children: [] } : null;
        }
        return null;
      })
      .filter(Boolean);


    return {
      data: items,
      pagination: {
        total: rootItems.pagination.total,
        page: rootItems.pagination.page,
        limit: rootItems.pagination.limit,
        total_pages: rootItems.pagination.total_pages,
      },
      counts: {
        total_folders: folderCount,
        total_files: fileCount,
      },
    };
  } catch (error) {
    logger.error('Error in getFolderHierarchy:', error);
    throw error;
  }
}

/**
 * Update a folder
 * @param {number} id - Folder ID
 * @param {Object} data - Folder data to update
 * @returns {Promise<Object>} Updated folder
 */
export const updateFolder = async (id, data) => {
  try {
    logger.debug(`Updating folder: ${id}`);
    await Folder.update(data, { where: { id } });

    const folder = await getFolderById(id);

    return folder;
  } catch (error) {
    logger.error('Error updating folder:', error);
    throw error;
  }
};

export const checkFolderExists = async id => {
  logger.debug(`Checking if folder exists: ${id}`);
  const existingFolder = await getFolderById(id);

  if (!existingFolder) {
    throw new Error('Folder not found');
  }
  return existingFolder;
};

export const checkParentFolderExists = async parent_id => {
  const existingParentFolder = await getFolderById(parent_id);
  if (!existingParentFolder) {
    throw new Error('Parent folder not found');
  }
  return existingParentFolder;
};

export const checkDuplicateFolderName = async (name, parent_id) => {
  
  logger.debug(`Checking for duplicate folder name: ${name} in parent folder: ${parent_id}`);
  const existingFolder = await Folder.findOne({
    where: {
      name,
      parent_id,
    },
  });

  if (existingFolder) {
    throw new Error('A folder with this name already exists in the same location');
  }
  return existingFolder;
};

/**
 * Delete a folder and its contents
 * @param {number} id - Folder ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFolder = async id => {
  try {
    // First check if folder exists
    const folder = await getFolderById(id);
    if (!folder) {
      throw new Error('Folder not found');
    }

    await Folder.destroy({ where: { id } });
    logger.info(`Folder deleted: ${id}`);

    return { success: true, message: 'Folder and its contents deleted successfully' };
  } catch (error) {
    logger.error('Error deleting folder:', error);
    throw error;
  }
};


/**
 * Get all items from the folder_files_root view
 * @returns {Promise<Object[]>} Array of root items (folders and files)
 */
export async function getAllRootItems(options = {}) {
  const tableName = `temp_folder_files_root`;
  const {
    page = 1,
    limit = 10,
    name,
    description,
    date,
    sort_by = 'updated_at',
    sort_order = 'desc',
  } = options;

  try {
    logger.debug('Starting getAllRootItems function');

    // Build WHERE clause for filters
    let whereClause = '';
    const whereConditions = [];

    if (name) {
      whereConditions.push(`name LIKE '%${name}%'`);
    }

    if (description) {
      whereConditions.push(`description LIKE '%${description}%'`);
    }

    if (date) {
      let dateCondition = new Date(date);
      dateCondition.setHours(0, 0, 0, 0);      
      whereConditions.push(`updated_at >= '${dateCondition.toISOString()}'`);
    }

    if (whereConditions.length > 0) {
      whereClause = `AND ${whereConditions.join(' AND ')}`;
    }

    // Create temporary table with filters
    const createTempTableQuery = `
      CREATE TEMPORARY TABLE ${tableName} AS
      SELECT 
        f.id,
        f.updated_at,
        'folder' as type
      FROM folders f
      WHERE f.parent_id IS NULL
      ${whereClause}
      
      UNION ALL
      
      SELECT 
        fi.id,
        fi.updated_at,
        'file' as type
      FROM files fi
      WHERE fi.folder_id IS NULL
      ${whereClause};
    `;

    logger.debug('Creating temporary table with filters');
    await sequelize.query(createTempTableQuery);

    // Get total count
    const countResult = await sequelize.query(`SELECT COUNT(*) as total FROM ${tableName}`, {
      type: sequelize.QueryTypes.SELECT,
    });
    const total = parseInt(countResult[0].total);

    // Fetch paginated data with sorting
    logger.debug('Fetching paginated data from temporary table');
    const rootItems = await sequelize.query(
      `SELECT * FROM ${tableName} 
       ORDER BY ${sort_by} ${sort_order}
       LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      { type: sequelize.QueryTypes.SELECT }
    );

    // Drop temporary table
    logger.debug('Dropping temporary table');
    await sequelize.query(`DROP TABLE IF EXISTS ${tableName}`);

    logger.info(`Retrieved ${rootItems.length} items from temporary table`);

    if (rootItems.length === 0) {
      logger.warn('No items found in temporary table');
    }

    return {
      items: rootItems,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    // Ensure temporary table is dropped even if there's an error
    logger.error('Error in getAllRootItems:', error);
    try {
      await sequelize.query(`DROP TABLE IF EXISTS ${tableName}`);
    } catch (dropError) {
      logger.error('Error dropping temporary table:', dropError);
    }

    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    throw error;
  }
}
