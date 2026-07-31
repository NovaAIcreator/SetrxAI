// imageRoute.js
// Manual "Generate Image" endpoint + Gallery endpoints (list/search/delete).
// Images ab Postgres mein persist hoti hain (imagesDb.js), isliye guest ke
// generate kiye images kaam karte hain (URL turant milti hai) lekin gallery
// list/search sirf logged-in users ke liye hai (unhi ki images dikhengi).

const express = require('express');
const router = express.Router();
const { generateImageBuffer } = require('./imageGen');
const { saveImage, getImageById, listUserImages, deleteUserImage } = require('./imagesDb');
const softAuth = require('./softAuth');
const authMiddleware = require('./authMiddleware');

router.post('/generate-image', softAuth, async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt required' });
  }

  try {
    const { buffer, contentType } = await generateImageBuffer(prompt.trim());
    const saved = await saveImage({ userId: req.userId, prompt: prompt.trim(), buffer, contentType });
    const imageUrl = `${req.protocol}://${req.get('host')}/api/image/${saved.id}`;
    res.json({ imageUrl, id: saved.id });
  } catch (err) {
    console.error('Image generation failed (dono providers try kiye):', err.message);
    res.status(503).json({ error: 'Image generate nahi ho payi — image services abhi unavailable hain, thodi der baad try karo' });
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
    res.send(entry.image_data);
  } catch (err) {
    console.error('Image fetch error:', err.message);
    res.status(500).send('Image load karne mein problem hui');
  }
});

// ---- Gallery: sirf logged-in users ke liye (search bhi 'query' param se) ----
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
        url: `${req.protocol}://${req.get('host')}/api/image/${img.id}`,
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