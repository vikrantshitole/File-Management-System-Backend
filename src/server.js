import app from './app.js';
import { sequelize } from './models/index.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection successful');

    // Sync database with models
    await sequelize.sync({ alter: false }); // Disable alter to prevent automatic schema changes
    logger.info('Database synced successfully');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
