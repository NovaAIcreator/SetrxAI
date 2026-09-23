const express = require('express');
const router = express.Router();

const KeyManager = require('./keyManager');
const { callGroq } = require('./groq');
const { callGemini } = require('./gemini');
const { callOpenRouter } = require('./openrouter');
const modePrompts = require('./prompts');
const authMiddleware = require('./authMiddleware');
const pool = require('./db');
const { think, verifyAnswer } = require('./brain');
const { planAgents, runScout, runLab } = require('./agents');

function collectKeys(prefix) {
  const arr = [];
  for (let i = 1; i <= 10; i++) {
    const key = process.env[prefix + '_' + i];
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
  coding: ['gemini', 'groq', 'openrouter'],
};

const PROVIDER_TOKEN_BUDGET = { groq: 12000, openrouter: 12000, gemini: 200000 };
const KEEP_FIRST_N = 2;

function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

function wantsLongForm(text) {
  return /\b(notes|full code|complete file|explain in detail|detailed|step by step|pura code|poora|saari|chapter|essay|write a|replace.*file|entire file|full file|detailed notes|revision notes)\b/i.test(
    String(text || '')
  );
}

function maxTokensFor(mode, userText) {
  const t = String(userText || '');
  const long = wantsLongForm(t);
  if (mode === 'coding' && long) return 4500;
  if (mode === 'coding') return 3000;
  if (mode === 'study' && long) return 3000;
  if (mode === 'study') return 1800;
  if (t.length < 180) return 1400;
  return 2200;
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
      { role: 'system', content: '[Note: ' + droppedCount + ' older messages not shown]' },
      ...recentChunk,
    ];
  }
  return [...firstChunk, ...recentChunk];
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
  const result = await pool.query(
    'SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC',
    [req.userId]
  );
  res.json(result.rows);
});

router.get('/sessions/:id/messages', authMiddleware, async (req, res) => {
  const result = await pool.query(
    'SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at ASC',
    [req.params.id]
  );
  res.json(result.rows);
});

router.delete('/sessions/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM sessions WHERE id = $1 AND user_id = $2', [
    req.params.id,
    req.userId,
  ]);
  res.json({ success: true });
});

async function updateSessionTitle(sessionId, firstMessage) {
  await pool.query('UPDATE sessions SET title = $1 WHERE id = $2', [
    (firstMessage || 'Chat').slice(0, 40),
    sessionId,
  ]);
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = require('jsonwebtoken').verify(
        authHeader.split(' ')[1],
        process.env.JWT_SECRET
      );
      req.userId = decoded.userId;
    } catch (e) {}
  }
  next();
}

function sse(res, obj) {
  res.write('data: ' + JSON.stringify(obj) + '\n\n');
}

function emitAgent(res, id, status, detail, logLine) {
  sse(res, { agent: { id, status, detail, logLine } });
}

router.post('/chat', optionalAuth, async (req, res) => {
  const { mode, messages, sessionId, image, images, file } = req.body;

  if (!mode || !modePrompts[mode]) {
    return res.status(400).json({ error: 'Invalid or missing mode' });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array required' });
  }

  const allImages =
    images && Array.isArray(images) && images.length
      ? images.slice(0, 4)
      : image
        ? [image]
        : null;

  const lastUserMessage = messages[messages.length - 1];
  const userText = lastUserMessage?.content || '';
  const isValidSessionId = sessionId && !isNaN(Number(sessionId));
  const canSaveToDb = isValidSessionId && req.userId;
  const genOptions = {
    temperature: 0.28,
    max_tokens: maxTokensFor(mode, userText),
  };

  if (canSaveToDb) {
    const savedText = allImages
      ? '[Image] ' + userText
      : file
        ? '[' + file.name + '] ' + userText
        : userText;
    await pool.query('INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)', [
      sessionId,
      'user',
      savedText,
    ]);
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM messages WHERE session_id = $1',
      [sessionId]
    );
    if (parseInt(countResult.rows[0].count) === 1) {
      await updateSessionTitle(sessionId, userText || 'Chat');
    }
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Provider routing (vision / model pick) — keep existing brain
  const decision = await think({
    userText,
    hasImage: !!(allImages && allImages.length),
    hasFile: !!file,
    mode,
  });

  // Multi-agent plan (LLM meaning — any wording)
  const plan = await planAgents({
    userText,
    mode,
    hasFile: !!file,
    fileName: file?.name || null,
    hasImage: !!(allImages && allImages.length),
  });

  // ── Scout ──
  if (file?.name) {
    emitAgent(res, 'scout', 'running', 'File', 'Reading: ' + file.name);
  }

  let scoutPack = { sources: [], context: '', checks: [] };

  if (plan.scout) {
    const thoughts = plan.scoutThoughts || ['Searching'];
    emitAgent(res, 'scout', 'running', 'Search', thoughts[0] || 'Search');
    for (let i = 1; i < thoughts.length; i++) {
      emitAgent(res, 'scout', 'running', 'Search', thoughts[i]);
    }
    scoutPack = await runScout({
      searchQuery: plan.searchQuery || userText,
      userText,
      onProgress: ({ detail, line }) => emitAgent(res, 'scout', 'running', detail, line),
    });
    emitAgent(res, 'scout', 'done', 'Sources ready', 'Context for Writer');
    if (scoutPack.sources?.length) {
      sse(res, { sources: scoutPack.sources, checks: scoutPack.checks || [] });
    }
  } else {
    emitAgent(
      res,
      'scout',
      'done',
      'Search off',
      (plan.scoutThoughts && plan.scoutThoughts[0]) || 'No web needed'
    );
  }

  // ── Lab ──
  let labNotes = '';
  if (plan.lab) {
    const thoughts = plan.labThoughts || ['Experiment'];
    emitAgent(res, 'lab', 'running', 'Lab', thoughts[0] || 'Lab');
    for (let i = 1; i < thoughts.length; i++) {
      emitAgent(res, 'lab', 'running', 'Lab', thoughts[i]);
    }
    const labPack = await runLab({
      userText,
      labGoal: plan.labGoal,
      mode,
      scoutContext: scoutPack.context,
      onProgress: ({ detail, line }) => emitAgent(res, 'lab', 'running', detail, line),
    });
    labNotes = labPack.notes || '';
    emitAgent(res, 'lab', 'done', 'Lab done', 'Notes ready');
  } else {
    emitAgent(
      res,
      'lab',
      'done',
      'Lab idle',
      (plan.labThoughts && plan.labThoughts[0]) || 'No experiment'
    );
  }

  // ── Writer prep ──
  emitAgent(
    res,
    'writer',
    'running',
    'Writing',
    (plan.writerThoughts && plan.writerThoughts[0]) || 'Drafting'
  );

  if (allImages && allImages.length) {
    sse(res, { thinking: 'Looking at the attached photo' });
  }

  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const dateNote = "\n\nToday's date: " + currentDate + '.';
  const searchNote = scoutPack.context
    ? '\n\nLive web search results (prefer these when relevant; cite links):\n' + scoutPack.context
    : '';
  const labNote = labNotes
    ? '\n\nLab agent notes (known + web + possible). If notes say INSUFFICIENT, do not invent a full solution:\n' +
      labNotes
    : '';
  const fileNote = file
    ? '\n\nUser attached file "' + file.name + '":\n' + file.text
    : '';
  const extra = dateNote + searchNote + labNote + fileNote;

  // LLM language (Hinglish / Hindi / English) — not keyword lists
  const finalSystemPrompt = modePrompts.buildSystemPromptAsync
    ? await modePrompts.buildSystemPromptAsync(mode, extra, userText)
    : modePrompts.buildSystemPrompt
      ? modePrompts.buildSystemPrompt(mode, extra, userText)
      : modePrompts[mode] + extra;
  const systemTokens = estimateTokens(finalSystemPrompt);

  const cleanMessages = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
    .map((m) => ({
      role: m.role,
      content: String(m.content).slice(0, 12000),
    }));

  let order;
  if (decision.action === 'vision' || (allImages && allImages.length)) {
    order = ['gemini', 'groq', 'openrouter'];
  } else if (decision.provider === 'groq') {
    order = ['groq', 'gemini', 'openrouter'];
  } else {
    order = modeProviderOrder[mode] || ['gemini', 'groq', 'openrouter'];
  }

  let succeeded = false;

  for (const providerName of order) {
    const manager = managers[providerName];
    const totalKeys = manager.keys.length;
    let providerSucceeded = false;

    for (let attempt = 0; attempt < totalKeys; attempt++) {
      if (manager.allKeysOnCooldown && manager.allKeysOnCooldown()) break;
      const keyEntry = manager.getAvailableKey();
      if (!keyEntry) break;

      const budget = (PROVIDER_TOKEN_BUDGET[providerName] || 6800) - systemTokens;
      const trimmedHistory = trimHistoryForBudget(cleanMessages, budget);
      const providerMessages = [
        { role: 'system', content: finalSystemPrompt },
        ...trimmedHistory,
      ];

      emitAgent(res, 'writer', 'running', 'Streaming', 'Sending answer');

      try {
        const { content } = await providerCallers[providerName](
          keyEntry.key,
          providerMessages,
          (chunk) => sse(res, { chunk }),
          allImages,
          genOptions
        );

        let finalContent = content;

        const shouldVerify =
          mode === 'coding' && content && content.length > 80 && wantsLongForm(userText);
        if (shouldVerify) {
          sse(res, { thinking: 'Checking the answer for mistakes' });
          try {
            const v = await verifyAnswer(userText, content, mode);
            if (!v.ok && v.fixed) {
              finalContent = v.fixed;
              sse(res, { replace: finalContent });
            }
          } catch (e) {
            console.warn('Verify skip:', e.message);
          }
        }

        if (canSaveToDb) {
          await pool.query(
            'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
            [sessionId, 'assistant', finalContent]
          );
        }

        emitAgent(res, 'writer', 'done', 'Done', 'Answer delivered');
        sse(res, { done: true, provider: providerName });
        res.end();
        succeeded = true;
        providerSucceeded = true;
        break;
      } catch (err) {
        console.error('[' + providerName + '] failed:', err.message);
        const status = err?.status || err?.response?.status;
        if (status === 429 || status === 413 || status === 503) {
          manager.markCooldown(keyEntry, 60000);
        } else if (status === 401 || status === 403) {
          manager.markCooldown(keyEntry, 300000);
        }
      }
    }
    if (providerSucceeded) break;
  }

  if (!succeeded) {
    emitAgent(res, 'writer', 'done', 'Failed', 'All providers down');
    sse(res, {
      error: 'All AI providers are unavailable right now. Please try again in a moment.',
    });
    res.end();
  }
});

module.exports = router;
