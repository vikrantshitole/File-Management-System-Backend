import app from './app.js';
import db from './database/database.js';
import {logger} from './utils/logger.js';

const PORT = process.env.PORT || 3000;

// Test database connection before starting the server
async function startServer() {
  try {
    await db.raw('SELECT 1');
    logger.info('Database connection successful');

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
}

startServer();
