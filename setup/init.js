#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

async function initializeDatabase() {
    try {
        // Check if NEON_DATABASE_URL is set
        if (!process.env.NEON_DATABASE_URL) {
            throw new Error('[ERROR] NEON_DATABASE_URL environment variable is not set. Please add it to your .env file.');
        }

        console.log('Connecting to database...');
        const sql = neon(process.env.NEON_DATABASE_URL);

        // Read the SQL file
        const sqlFilePath = path.join(__dirname, 'init.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log('Executing SQL queries from init.sql...');

        // Execute all SQL statements
        for (const statement of statements) {
            await sql.query(statement);
        }

        console.log('[SUCCESS] Database initialization completed successfully!');
        console.log('All tables and views have been created.');

    } catch (error) {
        console.error('[ERROR] Database initialization failed:', error.message);
        process.exit(1);
    }
}

// Run the initialization
initializeDatabase();
