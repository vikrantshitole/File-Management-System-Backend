import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import { join } from 'path';


const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the File Management System API' });
});

// API routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

export default app; 