import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log format for files (JSON)
const fileLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define log format for console (pretty print)
const consoleLogFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: fileLogFormat,
  transports: [
    new winston.transports.Console({ format: consoleLogFormat }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
    }),
  ],
});

// Create a stream object for morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Middleware: Request logger
function requestLogger(req, res, next) {
  const payload = ['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length
    ? ` | Payload: ${JSON.stringify(req.body)}`
    : '';

  logger.info(`${req.method} ${req.originalUrl} - Incoming Request${payload}`);
  req._startTime = Date.now();
  next();
}

// Middleware: Response logger
function responseLogger(req, res, next) {
  let errorData = null;

  res.on('error', (err) => {
    errorData = err;
  });

  res.on('finish', () => {
    const duration = Date.now() - (req._startTime || Date.now());
    const status = res.statusCode;

    let message = `${req.method} ${req.originalUrl} - Responded with ${status} in ${duration}ms`;

    if (errorData) {
      message += ` | Error: ${errorData.message}`;
    }

    if (status >= 500) {
      logger.error(message);
    } else if (status >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });

  next();
}

export { logger, requestLogger, responseLogger };
