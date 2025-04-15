import db from '../config/database.js';

async function testConnection() {
  try {
    // Test the connection
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful!');
    
    // Check if tables exist
    const tables = await db.raw('SHOW TABLES');
    console.log('\n📋 Existing tables:');
    if (tables[0].length === 0) {
      console.log('   No tables found. You may need to run migrations.');
    } else {
      tables[0].forEach(table => {
        console.log(`   - ${Object.values(table)[0]}`);
      });
    }
    
    // Close the connection
    await db.destroy();
    console.log('\n✅ Database connection closed successfully.');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection(); 