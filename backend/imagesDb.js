const pool = require('./db');

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let tableReady = null;
function ensureTable() {
  if (!tableReady) {
    tableReady = pool
      .query('CREATE EXTENSION IF NOT EXISTS pgcrypto;')
      .then(function () {
        return pool.query(`
          CREATE TABLE IF NOT EXISTS generated_images (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            prompt TEXT NOT NULL,
            content_type TEXT NOT NULL,
            image_data BYTEA NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );
        `);
      })
      .then(function () {
        return pool.query(`
          CREATE INDEX IF NOT EXISTS idx_generated_images_user
          ON generated_images (user_id, created_at DESC);
        `);
      });
  }
  return tableReady;
}

async function saveImage(opts) {
  await ensureTable();
  const result = await pool.query(
    `INSERT INTO generated_images (user_id, prompt, content_type, image_data)
     VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
    [opts.userId || null, opts.prompt, opts.contentType, opts.buffer]
  );
  return result.rows[0];
}

async function getImageById(id) {
  if (!UUID_REGEX.test(id)) return null;
  await ensureTable();
  const result = await pool.query(
    'SELECT content_type, image_data FROM generated_images WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function listUserImages(opts) {
  await ensureTable();
  const userId = opts.userId;
  const query = opts.query;
  const limit = opts.limit != null ? opts.limit : 24;
  const offset = opts.offset != null ? opts.offset : 0;
  const params = [userId];
  let sql = 'SELECT id, prompt, created_at FROM generated_images WHERE user_id = $1';
  if (query && query.trim()) {
    params.push('%' + query.trim() + '%');
    sql += ' AND prompt ILIKE $' + params.length;
  }
  params.push(limit);
  sql += ' ORDER BY created_at DESC LIMIT $' + params.length;
  params.push(offset);
  sql += ' OFFSET $' + params.length;
  const result = await pool.query(sql, params);
  return result.rows;
}

async function deleteUserImage(opts) {
  await ensureTable();
  await pool.query('DELETE FROM generated_images WHERE id = $1 AND user_id = $2', [
    opts.id,
    opts.userId,
  ]);
}

async function countImagesToday(userId) {
  await ensureTable();
  if (!userId) return 0;
  const result = await pool.query(
    `SELECT COUNT(*)::int AS c FROM generated_images
     WHERE user_id = $1
       AND created_at >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date
       AND created_at <  (NOW() AT TIME ZONE 'Asia/Kolkata')::date + INTERVAL '1 day'`,
    [userId]
  );
  return result.rows[0].c || 0;
}

module.exports = {
  saveImage: saveImage,
  getImageById: getImageById,
  listUserImages: listUserImages,
  deleteUserImage: deleteUserImage,
  countImagesToday: countImagesToday,
};
