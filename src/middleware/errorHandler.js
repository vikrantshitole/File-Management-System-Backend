import { logger } from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  logger.error(message, {
    statusCode,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });
  res.status(statusCode).json({
    status: err.status || 'error',
    statusCode,
    message: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
