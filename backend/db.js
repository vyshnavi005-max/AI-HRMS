const { Pool } = require('pg');
require('dotenv').config();

// Neon requires SSL. Strip channel_binding param if present (not supported by pg driver)
let connectionString = process.env.DATABASE_URL;
if (connectionString) {
    connectionString = connectionString.replace(/[&?]channel_binding=require/g, '');
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
    console.error('Unexpected DB client error:', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};
