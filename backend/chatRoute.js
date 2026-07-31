// chatRoute.js
// Main chat endpoint — sandwich history trimming + auto image-gen (URL-based,
// broken-image fix) + live-search + file-context

const express = require('express');
const router = express.Router();

const KeyManager = require('./keyManager');
const { callGroq } = require('./groq');
const { callGemini } = require('./gemini');
const { callOpenRouter } = require('./openrouter');
const { generateImageBuffer } = require('./imageGen');
const { saveImage } = require('./imageStore');
const { detectSearchIntent, searchWeb } = require('./searchIntent');
const modePrompts = require('./prompts');
const authMiddleware = require('./authMiddleware');
const pool = require('./db');

function collectKeys(prefix) {
  const arr = [];
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`${prefix}_${i}`];
    if (key) arr.push(key);
  }
  return arr.join(',');
}

const managers = {
  groq: new KeyManager('groq', collectKeys('GROQ_KEYS')),
  gemini: new KeyManager('gemini', collectKeys('GEMINI_KEYS')),
  openrouter: new KeyManager('openrouter', collectKeys('OPENROUTER_KEYS')),
};

const providerCallers = { groq: callGroq, gemini: callGemini, openrouter: callOpenRouter };

const modeProviderOrder = {
  general: ['groq', 'gemini', 'openrouter'],
  study: ['gemini', 'groq', 'openrouter'],
  coding: ['groq', 'openrouter', 'gemini'],
};

const PROVIDER_TOKEN_BUDGET = { groq: 6800, openrouter: 6800, gemini: 200000 };
const KEEP_FIRST_N = 2;

function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

function trimHistoryForBudget(messages, maxTokens) {
  if (messages.length <= KEEP_FIRST_N) return messages;

  const firstChunk = messages.slice(0, KEEP_FIRST_N);
  const remaining = messages.slice(KEEP_FIRST_N);
  let usedTokens = firstChunk.reduce((sum, m) => sum + estimateTokens(m.content), 0);

  const recentChunk = [];
  for (let i = remaining.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(remaining[i].content);
    if (usedTokens + msgTokens > maxTokens && recentChunk.length > 0) break;
    recentChunk.unshift(remaining[i]);
    usedTokens += msgTokens;
  }

  const droppedCount = remaining.length - recentChunk.length;
  if (droppedCount > 0) {
    return [
      ...firstChunk,
      { role: 'system', content: `[Note: ${droppedCount} purane messages history mein hai lekin yaha nahi dikhaye gaye — sirf shuruaat aur recent messages dikhaye ja rahe hai]` },
      ...recentChunk,
    ];
  }
  return [...firstChunk, ...recentChunk];
}

const IMAGE_INTENT_KEYWORDS = [
  'image banao', 'image bana do', 'image bana de', 'picture banao', 'photo banao',
  'chitra banao', 'tasveer banao', 'tasveer bana do', 'tasvir banao',
  'draw an image', 'draw a picture', 'generate an image', 'generate image',
  'create an image', 'create a picture', 'make an image', 'make a picture',
  'image generate karo', 'image generate kar do', 'photo generate karo',
  'ek image bana', 'ek photo bana', 'ek picture bana', 'draw me', 'paint me', 'sketch',
  'image do', 'photo do', 'tasveer do', 'picture do', 'image de do', 'photo de do',
  'iski image', 'iska image', 'is ki image', 'is ka image', 'draw kar', 'draw kardo',
  'banade image', 'image bnado', 'bnado image', 'image chahiye', 'photo chahiye',
];

function detectImageIntent(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return IMAGE_INTENT_KEYWORDS.some((k) => lower.includes(k));
}

router.post('/sessions', authMiddleware, async (req, res) => {
  const { mode, projectId } = req.body;
  const result = await pool.query(
    'INSERT INTO sessions (user_id, mode, project_id) VALUES ($1, $2, $3) RETURNING *',
    [req.userId, mode || 'general', projectId || null]
  );
  res.json(result.rows[0]);
});

router.get('/sessions', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
  res.json(result.rows);
});

router.get('/sessions/:id/messages', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at ASC', [req.params.id]);
  res.json(result.rows);
});

router.delete('/sessions/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM sessions WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.json({ success: true });
});

async function updateSessionTitle(sessionId, firstMessage) {
  const title = firstMessage.slice(0, 40);
  await pool.query('UPDATE sessions SET title = $1 WHERE id = $2', [title, sessionId]);
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      req.userId = decoded.userId;
    } catch (e) { /* invalid token, treat as guest */ }
  }
  next();
}

router.post('/chat', optionalAuth, async (req, res) => {
  const { mode, messages, sessionId, image, file } = req.body;

  if (!mode || !modePrompts[mode]) return res.status(400).json({ error: 'Invalid or missing mode' });
  if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'Messages array required' });

  const lastUserMessage = messages[messages.length - 1];
  const isValidSessionId = sessionId && !isNaN(Number(sessionId));
  const canSaveToDb = isValidSessionId && req.userId;

  if (canSaveToDb) {
    const savedText = image
      ? `📷 [Image] ${lastUserMessage.content}`
      : file
      ? `📄 [${file.name}] ${lastUserMessage.content}`
      : lastUserMessage.content;
    await pool.query('INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)', [sessionId, 'user', savedText]);
    const countResult = await pool.query('SELECT COUNT(*) FROM messages WHERE session_id = $1', [sessionId]);
    if (parseInt(countResult.rows[0].count) === 1) {
      await updateSessionTitle(sessionId, lastUserMessage.content || 'Chat');
    }
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // ---- Auto image generation — ab chhoti URL bhejta hai, bada base64 nahi ----
  if (!image && detectImageIntent(lastUserMessage.content)) {
    try {
      const { buffer, contentType } = await generateImageBuffer(lastUserMessage.content);
      const id = saveImage(buffer, contentType);
      const imageUrl = `${req.protocol}://${req.get('host')}/api/image/${id}`;
      const markdown = `![Generated image](${imageUrl})`;

      if (canSaveToDb) {
        await pool.query('INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)', [sessionId, 'assistant', markdown]);
      }

      res.write(`data: ${JSON.stringify({ chunk: markdown })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, provider: 'image-gen' })}\n\n`);
      res.end();
      return;
    } catch (err) {
      console.error('Auto image generation failed:', err.message);
      res.write(`data: ${JSON.stringify({ error: 'Image generate nahi ho payi, thodi der baad try karo' })}\n\n`);
      res.end();
      return;
    }
  }

  let searchContext = null;
  const needsSearch = await detectSearchIntent(lastUserMessage.content);
  if (needsSearch) {
    try {
      searchContext = await searchWeb(lastUserMessage.content);
    } catch (err) {
      console.warn('Search skip/fail hua:', err.message);
    }
  }

  const systemPrompt = modePrompts[mode];
  const currentDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const dateNote = `\n\nToday's date: ${currentDate}.`;

  const searchNote = searchContext
    ? `\n\nLive web search results for this query (use this to ground your answer in current, accurate info — prefer this over old memory):\n${searchContext}`
    : '';

  const fileNote = file
    ? `\n\nUser has attached a file named "${file.name}". Use its content to answer their question:\n${file.text}`
    : '';

  const finalSystemPrompt = systemPrompt + dateNote + searchNote + fileNote;
  const systemTokens = estimateTokens(finalSystemPrompt);

  const order = image ? ['gemini'] : modeProviderOrder[mode];
  let succeeded = false;

  for (const providerName of order) {
    const manager = managers[providerName];
    const totalKeys = manager.keys.length;
    let providerSucceeded = false;

    for (let attempt = 0; attempt < totalKeys; attempt++) {
      if (manager.allKeysOnCooldown()) break;

      const keyEntry = manager.getAvailableKey();
      if (!keyEntry) break;

      const budget = (PROVIDER_TOKEN_BUDGET[providerName] || 6800) - systemTokens;
      const trimmedHistory = trimHistoryForBudget(messages, budget);
      const providerMessages = [{ role: 'system', content: finalSystemPrompt }, ...trimmedHistory];

      try {
        const { content } = await providerCallers[providerName](
          keyEntry.key,
          providerMessages,
          (chunk) => res.write(`data: ${JSON.stringify({ chunk })}\n\n`),
          image
        );

        if (canSaveToDb) {
          await pool.query('INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)', [sessionId, 'assistant', content]);
        }

        res.write(`data: ${JSON.stringify({ done: true, provider: providerName })}\n\n`);
        res.end();
        succeeded = true;
        providerSucceeded = true;
        break;
      } catch (err) {
        console.error(`[${providerName}] key #${keyEntry.id} failed:`, err.message);
        const status = err?.status || err?.response?.status;
        if (status === 429 || status === 413 || status === 503) manager.markCooldown(keyEntry, 60000);
        else if (status === 401 || status === 403) manager.markCooldown(keyEntry, 300000);
      }
    }

    if (providerSucceeded) break;
  }

  if (!succeeded) {
    const errorMsg = image ? 'Image analyze karne mein problem hui, Gemini keys check karo' : 'Sabhi AI providers abhi unavailable hain';
    res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
    res.end();
  }
});

module.exports = router;