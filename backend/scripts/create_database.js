const { Client } = require('pg');
require('dotenv').config();

const createDatabase = async () => {
  // Connect to default postgres database to create our database
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres' // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server...');

    // Check if database exists
    const checkDb = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME || 'code_evaluation'}'`
    );

    if (checkDb.rows.length > 0) {
      console.log(`Database '${process.env.DB_NAME || 'code_evaluation'}' already exists! ✅`);
      await client.end();
      return;
    }

    // Create database
    const dbName = process.env.DB_NAME || 'code_evaluation';
    await client.query(`CREATE DATABASE ${dbName}`);
    console.log(`✅ Database '${dbName}' created successfully!`);
    
    await client.end();
    console.log('Database setup complete! 🎉');
  } catch (error) {
    console.error('❌ Error creating database:', error.message || error);
    console.error('\nFull error:', error);
    
    if (error.message && error.message.includes('password authentication failed')) {
      console.error('\n💡 Tip: Check your DB_PASSWORD in .env file');
    } else if (error.message && error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Tip: Make sure PostgreSQL is running');
    } else if (error.code === 'ENOENT' || error.message && error.message.includes('.env')) {
      console.error('\n💡 Tip: Make sure .env file exists in backend folder');
      console.error('   Required variables: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME');
    }
    
    process.exit(1);
  }
};

createDatabase();

