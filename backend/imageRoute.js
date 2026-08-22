const express = require('express');
const router = express.Router();
const { generateImageBuffer } = require('./imageGen');
const { saveImage, getImageById, listUserImages, deleteUserImage } = require('./imagesDb');
const softAuth = require('./softAuth');
const authMiddleware = require('./authMiddleware');

router.post('/generate-image', softAuth, async (req, res) => {
  const { prompt, image } = req.body;
  const hasImage = !!(image && image.data);
  const text = (prompt || '').trim();

  if (!text && !hasImage) {
    return res.status(400).json({ error: 'Prompt or photo required' });
  }

  try {
    const { buffer, contentType } = await generateImageBuffer(
      text || 'make this photo high quality, sharp and natural',
      hasImage ? image : null
    );
    const saved = await saveImage({
      userId: req.userId,
      prompt: text || 'photo edit',
      buffer,
      contentType,
    });
    const imageUrl = 'https://setrxai-backend.onrender.com/api/image/' + saved.id;
    res.json({
      imageUrl,
      id: saved.id,
      mode: hasImage ? 'edit' : 'generate',
    });
  } catch (err) {
    console.error('Image generation failed:', err.message);
    res.status(503).json({
      error: 'Image generate nahi ho payi — image services abhi unavailable hain, thodi der baad try karo',
    });
  }
});

router.get('/image/:id', async (req, res) => {
  try {
    const entry = await getImageById(req.params.id);
    if (!entry) {
      return res.status(404).send('Image mil nahi payi — delete ho chuki ho sakti hai');
    }
    res.setHeader('Content-Type', entry.content_type);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(entry.image_data);
  } catch (err) {
    console.error('Image fetch error:', err.message);
    res.status(500).send('Image load karne mein problem hui');
  }
});

router.get('/images', authMiddleware, async (req, res) => {
  try {
    const { query = '', limit = 30, offset = 0 } = req.query;
    const images = await listUserImages({
      userId: req.userId,
      query,
      limit: Math.min(Number(limit) || 30, 60),
      offset: Number(offset) || 0,
    });
    res.json(
      images.map((img) => ({
        id: img.id,
        prompt: img.prompt,
        createdAt: img.created_at,
        url: req.protocol + '://' + req.get('host') + '/api/image/' + img.id,
      }))
    );
  } catch (err) {
    console.error('Gallery list error:', err.message);
    res.status(500).json({ error: 'Gallery load nahi ho payi' });
  }
});

router.delete('/images/:id', authMiddleware, async (req, res) => {
  try {
    await deleteUserImage({ userId: req.userId, id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error('Image delete error:', err.message);
    res.status(500).json({ error: 'Delete nahi ho paya' });
  }
});

module.exports = router;
