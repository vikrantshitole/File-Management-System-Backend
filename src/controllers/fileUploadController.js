import { v4 as uuidv4 } from 'uuid';
import {
  upload,
  trackUploadProgress,
  cleanupUpload,
  deleteFile,
  insertFile,
  findFileById,
} from '../services/fileUploadService.js';
import { logger } from '../utils/logger.js';


export const uploadFile = async (req, res, next) => {
  const uploadId = uuidv4();
  const tracker = trackUploadProgress(uploadId);
  tracker.start();

  res.json({
    message: 'File uploaded successfully',
    uploadId,
  });
  tracker.update(10, req.file);

  upload.single('file')(req, res, async err => {
    if (err) {
      logger.error('File upload error:', err);
      tracker.fail(err);
      next({
        ...err,
        statusCode: 400,
        status: 'error',
        message: 'An unexpected error occurred while uploading the file',
        code: 'FILE_UPLOAD_ERROR',
      });
    }

    if (!req.file) {
      const error = new Error('No file uploaded');
      logger.warn('No file uploaded');
      tracker.fail(error);
      next({
        ...error,
        statusCode: 400,
        status: 'error',
        message: 'No file uploaded',
        code: 'FILE_UPLOAD_ERROR',
      });
    }

    tracker.update(20, req.file);
    logger.debug('File upload progress:', { uploadId, progress: 20 });

    try {
      const fileData = {
        name: req.file.originalname,
        file_path: req.file.path,
        size: req.file.size,
        type: req.body.file_type,
        folder_id: req.body.folder_id || null,
      };

      tracker.update(40);

      const insertedFile = await insertFile(fileData);

      tracker.update(80);

      const fileId = insertedFile.id;
      
      tracker.complete(insertedFile);
      logger.info('File uploaded successfully:', { fileId, uploadId });
    } catch (error) {
      logger.error('Error inserting file into database:', error);
      tracker.fail(error);
      next({
        ...error,
        statusCode: 500,
        status: 'error',
        message: 'An unexpected error occurred while uploading the file',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  });
};

export const getUploadProgress = (req, res) => {
  const { uploadId } = req.params;
  logger.debug('Getting upload progress:', { uploadId });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Credentials': 'true',
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', uploadId })}\n\n`);

  const sendProgress = () => {
    const status = trackUploadProgress(uploadId).getStatus();

    if (status) {
      res.write(`data: ${JSON.stringify(status)}\n\n`);
      logger.debug('Upload progress:', { uploadId, status });
      if (['completed', 'failed'].includes(status.status)) {
        res.write(`event: end\ndata: done\n\n`);
        cleanupUpload(uploadId);
        clearInterval(progressInterval);
        res.end();
        logger.info('Upload progress stream ended:', { uploadId, status: status.status });
      }
    }
  };

  const progressInterval = setInterval(sendProgress, 1000);

  req.on('close', () => {
    clearInterval(progressInterval);
    cleanupUpload(uploadId);
    logger.info('Upload progress stream closed by client:', { uploadId });
  });
};
/**
 * Delete a file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteFileHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.debug('Deleting file:', { fileId: id });

    const result = await deleteFile(id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error in deleteFileHandler:', error);
    if (error.message === 'File not found') {
      logger.warn('File not found:', { fileId: req.params.id });
      return next({
        ...error,
        statusCode: 404,
        status: 'error',
        message: error.message,
        code: 'FILE_NOT_FOUND',
      });
    }
    next({
      ...error,
      statusCode: 500,
      status: 'error',
      message: 'An unexpected error occurred while deleting the file',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
};
