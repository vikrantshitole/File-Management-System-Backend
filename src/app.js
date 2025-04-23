import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import { join } from 'path';
import { requestLogger, responseLogger } from './utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    if (process.env.FRONTEND_URL === origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files from the uploads directory\
app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

app.use(requestLogger);
app.use(responseLogger);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the File Management System API' });
});

app.use('/api', routes);

app.use(errorHandler);

export default app;
