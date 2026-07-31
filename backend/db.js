// db.js
// Neon se connection — WebSocket (port 443) ke through, taaki school/office
// WiFi ka port-5432-blocking kabhi problem na kare

const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;