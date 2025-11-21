const { Pool } = require('pg');
require('dotenv').config();

const createSampleChallenge = async () => {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'code_evaluation',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await pool.connect();
    console.log('Connected to database...');

    // Get first admin user (or create one if doesn't exist)
    let adminResult = await pool.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );

    let adminId;
    if (adminResult.rows.length === 0) {
      // Create a default admin user
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = await pool.query(
        `INSERT INTO users (name, email, password, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id`,
        ['Admin User', 'admin@example.com', hashedPassword, 'admin']
      );
      adminId = newAdmin.rows[0].id;
      console.log('Created default admin user (email: admin@example.com, password: admin123)');
    } else {
      adminId = adminResult.rows[0].id;
    }

    // Check if challenge already exists
    const existingChallenge = await pool.query(
      "SELECT id FROM challenges WHERE title = 'Add Two Numbers'"
    );

    if (existingChallenge.rows.length > 0) {
      console.log('Sample challenge already exists! ✅');
      await pool.end();
      return;
    }

    // Create sample challenge
    const challengeData = {
      title: 'Add Two Numbers',
      description: `Write a function that takes two numbers as input and returns their sum.

Example:
Input: 5, 3
Output: 8

Instructions:
- Create a function named 'add' or 'solution'
- The function should accept two parameters
- Return the sum of the two numbers`,
      language: 'python',
      testcases: [
        {
          description: 'Basic addition with positive numbers',
          input: '5, 3',
          expectedOutput: '8'
        },
        {
          description: 'Addition with negative numbers',
          input: '-5, 10',
          expectedOutput: '5'
        },
        {
          description: 'Addition with zero',
          input: '0, 0',
          expectedOutput: '0'
        },
        {
          description: 'Large numbers',
          input: '100, 200',
          expectedOutput: '300'
        }
      ]
    };

    const result = await pool.query(
      `INSERT INTO challenges (title, description, language, testcases, created_by) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, title`,
      [
        challengeData.title,
        challengeData.description,
        challengeData.language,
        JSON.stringify(challengeData.testcases),
        adminId
      ]
    );

    console.log('✅ Sample challenge created successfully!');
    console.log(`   Challenge ID: ${result.rows[0].id}`);
    console.log(`   Title: ${result.rows[0].title}`);
    console.log('\n📝 Challenge Details:');
    console.log(`   Language: ${challengeData.language}`);
    console.log(`   Test Cases: ${challengeData.testcases.length}`);
    console.log('\n🎯 Now you can see this challenge in the candidate dashboard!');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error creating sample challenge:', error.message);
    process.exit(1);
  }
};

createSampleChallenge();

