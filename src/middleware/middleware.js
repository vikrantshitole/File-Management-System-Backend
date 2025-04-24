import dotenv from 'dotenv';
dotenv.config();

export const checkApiKey = (req, res, next) => {
  const key = req.headers['x-api-key'] || req.query.api_key;
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

export const corsOptions = {
  origin: (origin, callback) => {
    console.log(origin);
    if (process.env.FRONTEND_URL === origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};
