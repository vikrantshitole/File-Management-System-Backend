import app from './app.js';
import db from './config/database.js';

const PORT = process.env.PORT || 3000;

// Test database connection before starting the server
async function startServer() {
  try {
// Test database connection
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful!');
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT }`);
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

startServer(); 