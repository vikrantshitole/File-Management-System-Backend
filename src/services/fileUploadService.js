import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
// import db from '../database/database.js';
import File from '../models/File.js';
import { logger } from '../utils/logger.js';    
const allowedExtensions = ['.pdf', '.png', '.docx', '.jpg', '.svg', '.gif', '.txt'];
const db = {}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    logger.debug(`Upload directory created: ${uploadDir}`);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    req.body.file_type = extension.slice(1);
    logger.debug(`File extension: ${extension}`);
    logger.debug(`File type: ${req.body.file_type}`);
    cb(null, `${uniqueId}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  logger.debug(`File extension: ${ext}`); 
  if (!allowedExtensions.includes(ext)) {
    logger.warn(`File extension not allowed: ${ext}`);
    cb(new Error('Only pdf, png, docx, jpg, svg, gif, and txt files are allowed'), false);
  }
  logger.debug(`File allowed: ${ext}`);
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const activeUploads = new Map();

/**
 * Track the progress of an upload
 * @param {string} uploadId - Unique identifier for the upload
 * @returns {Object} Progress tracking object
 */
export const trackUploadProgress = uploadId => {
  logger.debug(`Tracking upload progress for: ${uploadId}`);
  return {
    start: () => {
      activeUploads.set(uploadId, { progress: 0, status: 'uploading', file: null });
      logger.debug(`Upload started: ${uploadId}`);
    },
    update: (progress, file) => {
      logger.debug(`Updating upload progress for: ${uploadId}, progress: ${progress}`);
      const upload = activeUploads.get(uploadId);
      if (upload) {
        upload.progress = progress;
        if (file) {
          upload.file = file;
        }
        logger.debug(`Upload file updated: ${uploadId}`);
        activeUploads.set(uploadId, upload);
      }
    },
    complete: () => {
      const upload = activeUploads.get(uploadId);
      logger.debug(`Upload completed: ${uploadId}`);
      activeUploads.set(uploadId, {
        ...upload,
        progress: 100,
        status: 'completed',
      });
    },
    fail: error => {
      logger.debug(`Upload failed: ${uploadId}`);
      activeUploads.set(uploadId, {
        progress: 0,
        status: 'failed',
        error: error.message,
      });
    },
    getStatus: () => activeUploads.get(uploadId),
  };
};

export const cleanupUpload = uploadId => {
  logger.debug(`Cleaning up upload: ${uploadId}`);
  activeUploads.delete(uploadId);
};

/**
 * Delete a file
 * @param {number} id - File ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFile = async id => {
  try {
    // First check if file exists
    await findFileById(id);

    await File.destroy({ where: { id } });
    logger.debug(`File deleted: ${id}`);

    return { success: true, message: 'File deleted successfully' };
  } catch (error) {
    logger.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Insert a file record into the database
 * @param {Object} fileData - File data
 * @returns {Promise<Object>} Inserted file record
 */
export const insertFile = async fileData => {
  try {
    const { name, type, folder_id, file_path, size, description } = fileData;
    logger.debug(`Inserting file: ${name}, type: ${type}, folder_id: ${folder_id}, file_path: ${file_path}, size: ${size}, description: ${description}`);
    const file = await File.create({
      name,
      type,
      folder_id,
      file_path,
      size,
      description,
    });

    logger.debug(`File inserted: ${file}`);

    return file;
  } catch (error) {
    logger.error('Error inserting file:', error);
    throw error;
  }
};

/**
 * Find a file by its ID
 * @param {number} id - File ID
 * @returns {Promise<Object>} File record
 */
export const findFileById = async id => {
  try {
    logger.debug(`Finding file by ID: ${id}`);
    const file = await File.findByPk(id);
    logger.debug(`File found: ${file?.id}`);
    if (!file) {
      logger.warn('File not found');
      throw new Error('File not found');
    }
    logger.debug(`Returning file: ${file}`);
    return file;
  } catch (error) {
    logger.error('Error finding file:', error);
    throw error;
  }
};
