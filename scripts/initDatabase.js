const mysql = require('mysql2/promise');
require('dotenv').config();

const initDatabase = async () => {
  let connection;

  try {
    // Connect without specifying a DB first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    const dbName = process.env.DB_NAME || 'indiabills_demo';

    console.log('📦 Creating database...');

    // Use `query()` instead of `execute()` for these commands
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.query(`USE \`${dbName}\`;`);

    console.log('📋 Creating tables...');

    // `execute()` is fine for CREATE TABLE
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS demo_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        organization_name VARCHAR(255),
        business_name VARCHAR(255),
        organization_email VARCHAR(255),
        organization_phone VARCHAR(20),
        address_line TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pin_code VARCHAR(10),
        user_email VARCHAR(255),
        user_full_name VARCHAR(255),
        user_phone VARCHAR(20),
        job_title VARCHAR(100),
        department VARCHAR(100),
        demo_credentials JSON,
        external_api_response JSON,
        status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      )
    `);

    console.log('✅ Database and tables created successfully!');
    console.log('🎯 You can now start the server with: npm run dev');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

initDatabase();
