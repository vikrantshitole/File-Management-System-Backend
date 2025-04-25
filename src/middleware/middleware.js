import dotenv from 'dotenv';
dotenv.config();

export const checkApiKey = (req, res, next) => {
  const key = req.headers['api-key'] || req.query.api_key;

  if (key !== process.env.API_KEY) {
    return next({
      status: 'error',
      statusCode: 403,
      message: 'Invalid API key',
      code: 'INVALID_API_KEY',
    });
  }
  next();
};
import cors from 'cors';

export const dynamicCors = (req, res, callback) => {
  const allowedOrigin = process.env.FRONTEND_URL;
  const queryOrigin = req.query.origin;
  const originHeader = req.headers.origin;
  if (originHeader === allowedOrigin || queryOrigin === allowedOrigin) {
    callback(null);
  } else {
    callback(new Error('Not allowed by CORS'), { origin: false });
  }
};
