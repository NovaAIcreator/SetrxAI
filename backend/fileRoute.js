// fileRoute.js
// File upload/parse endpoint — PDF, DOCX, TXT, CSV se text nikalta hai

const express = require('express');
const router = express.Router();
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const MAX_CHARS = 8000;

router.post('/parse-file', async (req, res) => {
  const { fileName, mimeType, data } = req.body;

  if (!data || !mimeType) {
    return res.status(400).json({ error: 'File data required' });
  }

  const buffer = Buffer.from(data, 'base64');

  try {
    let text = '';

    if (mimeType === 'application/pdf') {
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (mimeType === 'text/plain' || mimeType === 'text/csv') {
      text = buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Ye file type abhi support nahi hai (PDF, DOCX, TXT, CSV try karo)' });
    }

    text = text.trim();
    if (!text) {
      return res.status(422).json({ error: 'File se koi readable text nahi mila (scanned/image PDF ho sakta hai)' });
    }

    const truncated = text.length > MAX_CHARS;
    const finalText = truncated
      ? text.slice(0, MAX_CHARS) + '\n\n[...file lambi thi, sirf shuru ka hissa liya gaya]'
      : text;

    res.json({ fileName, text: finalText, truncated });
  } catch (err) {
    console.error('File parse error:', err.message);
    res.status(500).json({ error: 'File parse karne mein problem hui — file corrupt ho sakti hai' });
  }
});

module.exports = router;