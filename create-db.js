const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433'), // Ensure using 5433
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: 'postgres', // Connect to default DB
    });

    try {
        await client.connect();
        console.log('Connected to Postgres');

        // check if db exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'erp_pangan_masa_depan'");
        if (res.rowCount === 0) {
            console.log('Creating database erp_pangan_masa_depan...');
            await client.query('CREATE DATABASE erp_pangan_masa_depan');
            console.log('Database created successfully.');
        } else {
            console.log('Database already exists.');
        }
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await client.end();
    }
}

createDatabase();
