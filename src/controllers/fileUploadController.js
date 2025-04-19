import { v4 as uuidv4 } from 'uuid';
import {
  upload,
  trackUploadProgress,
  cleanupUpload,
  deleteFile
} from '../services/fileUploadService.js';
import db from '../config/database.js';

export const uploadFile = async (req, res) => {
  const uploadId = uuidv4();
  const tracker = trackUploadProgress(uploadId);
  tracker.start();
  
  res.json({
    message: 'File uploaded successfully',
    uploadId,
  });
  upload.single('file')(req, res, async (err) => {
    if (err) {
      tracker.fail(err);
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      const error = new Error('No file uploaded');
      tracker.fail(error);
      return res.status(400).json({ error: error.message });
    }

    tracker.update(20, req.file);
    
    try {
      const fileData = {
        name: req.file.originalname,
        file_path: req.file.path,
        size: req.file.size,
        type: req.body.file_type,
        folder_id: req.body.folder_id || null,
       };

      tracker.update(40);
      const [fileId] = await db('files').insert(fileData);
      tracker.update(80);
      const insertedFile = await db('files').where('id', fileId).first();
      tracker.complete(insertedFile);


    } catch (error) {
      console.log('Error inserting file into database:', error);
      tracker.fail(error);
      res.status(500).json({ error: error.message });
    }
  });
};

export const getUploadProgress = (req, res) => {
  const { uploadId } = req.params;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', uploadId })}\n\n`);

  const sendProgress = () => {
    const status = trackUploadProgress(uploadId).getStatus();

    if (status) {
      res.write(`data: ${JSON.stringify(status)}\n\n`);

      if (['completed', 'failed'].includes(status.status)) {
        cleanupUpload(uploadId);
        clearInterval(progressInterval);
        res.end();
      }
    }
  };

  const progressInterval = setInterval(sendProgress, 1000);

  req.on('close', () => {
    clearInterval(progressInterval);
    cleanupUpload(uploadId);
  });
};
/**
 * Delete a file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteFileHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteFile(id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in deleteFileHandler:', error);
    if (error.message === 'File not found') {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};