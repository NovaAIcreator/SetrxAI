const express = require('express');
const router = express.Router();
const { generateImageBuffer } = require('./imageGen');
const {
  saveImage,
  getImageById,
  listUserImages,
  deleteUserImage,
  countImagesToday,
} = require('./imagesDb');
const softAuth = require('./softAuth');
const authMiddleware = require('./authMiddleware');

const IMAGE_DAILY_LIMIT = 8;
const PUBLIC_API =
  process.env.PUBLIC_API_URL || 'https://setrxai-backend.onrender.com';

router.get('/usage', softAuth, async function (req, res) {
  try {
    const used = req.userId ? await countImagesToday(req.userId) : 0;
    res.json({
      search: { remaining: 99, limit: 99 },
      image: {
        remaining: Math.max(0, IMAGE_DAILY_LIMIT - used),
        limit: IMAGE_DAILY_LIMIT,
        used: used,
      },
    });
  } catch (e) {
    res.json({
      search: { remaining: 99, limit: 99 },
      image: { remaining: IMAGE_DAILY_LIMIT, limit: IMAGE_DAILY_LIMIT, used: 0 },
    });
  }
});

router.post('/generate-image', softAuth, async function (req, res) {
  const prompt = req.body.prompt;
  const image = req.body.image;
  const sessionId = req.body.sessionId;
  const saveHistory = req.body.saveHistory;
  const hasImage = !!(image && image.data);
  const text = (prompt || '').trim();

  if (!text && !hasImage) {
    return res.status(400).json({ error: 'Prompt or photo required' });
  }

  if (req.userId) {
    const used = await countImagesToday(req.userId);
    if (used >= IMAGE_DAILY_LIMIT) {
      return res.status(429).json({
        error: 'Aaj ki image limit khatam (8/day). Kal try karo.',
        remaining: 0,
        limit: IMAGE_DAILY_LIMIT,
      });
    }
  }

  try {
    const out = await generateImageBuffer(
      text || 'make this photo high quality sharp natural',
      hasImage ? image : null
    );
    const saved = await saveImage({
      userId: req.userId,
      prompt: text || 'photo edit',
      buffer: out.buffer,
      contentType: out.contentType,
    });
    const imageUrl = PUBLIC_API + '/api/image/' + saved.id;

    if (sessionId && req.userId && saveHistory) {
      try {
        const pool = require('./db');
        const userLabel = hasImage
          ? text
            ? 'Edit photo: "' + text + '"'
            : 'Improve this photo'
          : 'Generate image: "' + text + '"';
        await pool.query(
          'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
          [sessionId, 'user', userLabel]
        );
        await pool.query(
          'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
          [
            sessionId,
            'assistant',
            '__IMAGE__' + imageUrl + '__PROMPT__' + (text || 'photo edit'),
          ]
        );
      } catch (e) {
        console.error('Image history save failed:', e.message);
      }
    }

    const usedAfter = req.userId ? await countImagesToday(req.userId) : 0;
    res.json({
      imageUrl: imageUrl,
      id: saved.id,
      usage: {
        image: {
          remaining: Math.max(0, IMAGE_DAILY_LIMIT - usedAfter),
          limit: IMAGE_DAILY_LIMIT,
          used: usedAfter,
        },
      },
    });
  } catch (err) {
    console.error('Image generation failed:', err.message);
    res.status(503).json({
      error: 'Image generate nahi ho payi — thodi der baad try karo',
    });
  }
});

router.get('/image/:id', async function (req, res) {
  try {
    const entry = await getImageById(req.params.id);
    if (!entry) return res.status(404).send('Image not found');
    res.setHeader('Content-Type', entry.content_type);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(entry.image_data);
  } catch (err) {
    res.status(500).send('Image load error');
  }
});

router.get('/images', authMiddleware, async function (req, res) {
  try {
    const query = req.query.query || '';
    const limit = req.query.limit || 30;
    const offset = req.query.offset || 0;
    const images = await listUserImages({
      userId: req.userId,
      query: query,
      limit: Math.min(Number(limit) || 30, 60),
      offset: Number(offset) || 0,
    });
    res.json(
      images.map(function (img) {
        return {
          id: img.id,
          prompt: img.prompt,
          createdAt: img.created_at,
          url: req.protocol + '://' + req.get('host') + '/api/image/' + img.id,
        };
      })
    );
  } catch (err) {
    res.status(500).json({ error: 'Gallery load failed' });
  }
});

router.delete('/images/:id', authMiddleware, async function (req, res) {
  try {
    await deleteUserImage({ userId: req.userId, id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
