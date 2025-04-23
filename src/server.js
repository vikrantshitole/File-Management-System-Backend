import app from './app.js';
import { sequelize } from './models/index.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 3000;

// Test database connection and sync models before starting the server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection successful');

    // Sync all models
    await sequelize.sync();
    logger.info('Database models synchronized');

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
}

startServer();
