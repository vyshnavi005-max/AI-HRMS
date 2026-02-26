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
    connectionTimeoutMillis: 20000,
});

pool.on('error', (err) => {
    console.error('Unexpected DB client error:', err);
});

// retry wrapper — handles Neon cold-start / transient connection errors
async function queryWithRetry(text, params, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await pool.query(text, params);
        } catch (err) {
            const isTransient =
                err.code === 'ECONNREFUSED' ||
                err.code === 'ETIMEDOUT' ||
                err.code === 'ECONNRESET' ||
                err.code === 'CONNECTION_ENDED' ||
                err.message?.includes('Connection terminated') ||
                err.message?.includes('timeout');
            if (isTransient && attempt < retries) {
                console.warn(`DB query attempt ${attempt} failed (${err.code || err.message}), retrying...`);
                await new Promise(r => setTimeout(r, 500 * attempt));
                continue;
            }
            throw err;
        }
    }
}

module.exports = {
    query: (text, params) => queryWithRetry(text, params),
    pool,
};
