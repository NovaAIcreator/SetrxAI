// imagesDb.js
// Generated images ab Postgres mein persist hoti hain (pehle sirf 1hr wali
// in-memory Map thi — restart ya TTL expire hote hi gaayab ho jaati thi,
// jisse gallery/history possible hi nahi thi). Har image ka owner (user_id)
// bhi store hota hai taaki gallery sirf apni images dikhaye.

const pool = require('./db');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let tableReady = null;
function ensureTable() {
  if (!tableReady) {
    tableReady = pool
      .query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`)
      .then(() =>
        pool.query(`
          CREATE TABLE IF NOT EXISTS generated_images (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            prompt TEXT NOT NULL,
            content_type TEXT NOT NULL,
            image_data BYTEA NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );
        `)
      )
      .then(() =>
        pool.query(`
          CREATE INDEX IF NOT EXISTS idx_generated_images_user
          ON generated_images (user_id, created_at DESC);
        `)
      );
  }
  return tableReady;
}

async function saveImage({ userId, prompt, buffer, contentType }) {
  await ensureTable();
  const result = await pool.query(
    `INSERT INTO generated_images (user_id, prompt, content_type, image_data)
     VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
    [userId || null, prompt, contentType, buffer]
  );
  return result.rows[0];
}

async function getImageById(id) {
  // Purane system se bani IDs (24-char hex, UUID nahi) DB query pe crash
  // karti thi ("invalid input syntax for type uuid") — ab pehle hi validate
  // karke clean 404 de dete hain.
  if (!UUID_REGEX.test(id)) return null;

  await ensureTable();
  const result = await pool.query(
    `SELECT content_type, image_data FROM generated_images WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

// prompt text se search (ILIKE = case-insensitive partial match)
async function listUserImages({ userId, query, limit = 24, offset = 0 }) {
  await ensureTable();
  const params = [userId];
  let sql = `SELECT id, prompt, created_at FROM generated_images WHERE user_id = $1`;
  if (query && query.trim()) {
    params.push(`%${query.trim()}%`);
    sql += ` AND prompt ILIKE $${params.length}`;
  }
  params.push(limit);
  sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;
  params.push(offset);
  sql += ` OFFSET $${params.length}`;

  const result = await pool.query(sql, params);
  return result.rows;
}

async function deleteUserImage({ userId, id }) {
  await ensureTable();
  await pool.query(`DELETE FROM generated_images WHERE id = $1 AND user_id = $2`, [id, userId]);
}

module.exports = { saveImage, getImageById, listUserImages, deleteUserImage };