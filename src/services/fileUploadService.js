import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/database.js';

const allowedExtensions = ['.pdf', '.png', '.docx', '.jpg', '.svg', '.gif', '.txt'];
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    req.body.file_type = extension.slice(1);
    cb(null, `${uniqueId}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    cb(new Error('Only pdf, png, docx, jpg, svg, gif, and txt files are allowed'), false);
  }
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
  return {
    start: () => {
      activeUploads.set(uploadId, { progress: 0, status: 'uploading', file: null });
    },
    update: (progress, file) => {
      const upload = activeUploads.get(uploadId);
      if (upload) {
        upload.progress = progress;
        if (file) {
          upload.file = file;
        }

        activeUploads.set(uploadId, upload);
      }
    },
    complete: () => {
      const upload = activeUploads.get(uploadId);

      activeUploads.set(uploadId, {
        ...upload,
        progress: 100,
        status: 'completed',
      });
    },
    fail: error => {
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

    await db('files').where('id', id).delete();

    return { success: true, message: 'File deleted successfully' };
  } catch (error) {
    console.error('Error deleting file:', error);
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
    const [file] = await db('files').insert({
      name,
      type,
      folder_id,
      file_path,
      size,
      description,
    });

    return file;
  } catch (error) {
    console.error('Error inserting file:', error);
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
    const file = await db('files').where('id', id).first();
    if (!file) {
      throw new Error('File not found');
    }
    return file;
  } catch (error) {
    console.error('Error finding file:', error);
    throw error;
  }
};
