import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';

// Configure multer for file upload
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
    req.body.file_type = extension.slice(1); // Store file type in req.body
    cb(null, `${uniqueId}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Add file type restrictions if needed
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Store active uploads and their progress
const activeUploads = new Map();

export const trackUploadProgress = (uploadId) => {
  return {
    start: () => {
      activeUploads.set(uploadId, { progress: 0, status: 'uploading',  file: null });
    },
    update: (progress,file) => {
      const upload = activeUploads.get(uploadId);
      if (upload) {
        upload.progress = progress;
        if (file) {
          upload.file = file;
        }

        activeUploads.set(uploadId, upload);
      }
    },
    complete: (fileData) => {
      const upload = activeUploads.get(uploadId);

      activeUploads.set(uploadId, { 
        ...upload,
        progress: 100, 
        status: 'completed'      });
    },
    fail: (error) => {
      activeUploads.set(uploadId, { 
        progress: 0, 
        status: 'failed',
        error: error.message 
      });
    },
    getStatus: () => activeUploads.get(uploadId)
  };
};

export const getUploadStatus = (uploadId) => {
  return activeUploads.get(uploadId);
};

export const cleanupUpload = (uploadId) => {
  activeUploads.delete(uploadId);
}; 

/**
 * Delete a file
 * @param {number} id - File ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFile = async (id) => {
  try {
    // First check if file exists
    const file = await db('files').where('id', id).first();
    if (!file) {
      throw new Error('File not found');
    }

    // Delete the file record
    await db('files').where('id', id).delete();

    return { success: true, message: 'File deleted successfully' };
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};
