const { GoogleGenerativeAI } = require('@google/generative-ai');

function getGeminiKey() {
  for (let i = 1; i <= 10; i++) {
    const k = process.env['GEMINI_KEYS_' + i];
    if (k && k.trim()) return k.trim();
  }
  return null;
}

function topicHint(userText) {
  const t = (userText || '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  const short = t.length > 48 ? t.slice(0, 48) + '…' : t;
  return short;
}

function fallback(userText, hasImage, mode) {
  const t = (userText || '').toLowerCase();
  const topic = topicHint(userText);

  if (hasImage && !/banao|edit|improve|accha|image|logo/.test(t)) {
    return {
      thought: topic ? 'Reading the photo about: ' + topic : 'Reading the photo',
      action: 'vision',
      provider: 'gemini',
      search: false,
    };
  }
  if (/banao|generate image|tasveer|logo bana/.test(t)) {
    return {
      thought: topic ? 'Planning image: ' + topic : 'Planning the image',
      action: 'image',
      provider: 'flux',
      search: false,
    };
  }
  if (/news|latest|today|price|2025|2026|weather|score/.test(t)) {
    return {
      thought: topic ? 'Looking up: ' + topic : 'Looking up current information',
      action: 'chat',
      provider: 'gemini',
      search: true,
    };
  }
  if (mode === 'coding') {
    return {
      thought: topic ? 'Working through the code for: ' + topic : 'Working through the code',
      action: 'chat',
      provider: 'gemini',
      search: false,
    };
  }
  if (mode === 'study') {
    return {
      thought: topic ? 'Breaking down: ' + topic : 'Working through the concept',
      action: 'chat',
      provider: 'gemini',
      search: false,
    };
  }
  return {
    thought: topic ? 'Thinking about: ' + topic : 'Thinking through this',
    action: 'chat',
    provider: 'groq',
    search: false,
  };
}

async function think({ userText, hasImage, hasFile, mode }) {
  const key = getGeminiKey();
  if (!key) return fallback(userText, hasImage, mode);
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 150,
        responseMimeType: 'application/json',
      },
    });
    const r = await model.generateContent(
      `You are a routing brain for SetrxAI.
Mode=\( {mode}. hasImage= \){!!hasImage}. hasFile=${!!hasFile}.

Output ONLY JSON:
{"thought":"English, 6-12 words, NO emoji. Must mention the specific topic from the user message (like Grok status lines). Different every time.","action":"chat"|"vision"|"image","provider":"gemini"|"groq","search":false}

Rules:
- photo + question → vision + gemini
- code/study → gemini
- casual chat → groq
- image only if user wants a picture made
- search:true only for live/current news/price/weather/score

Good thought examples:
- "Checking React useEffect dependency rules"
- "Looking up today's gold price in India"
- "Outlining photosynthesis exam notes"
- "Reading the attached photo labels"

User message:
${userText || '(empty)'}`
    );
    const p = JSON.parse((r.response.text() || '').replace(/```json|```/g, '').trim());
    let thought = String(p.thought || '')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
      .trim()
      .slice(0, 90);
    if (!thought || thought.length < 8) {
      return fallback(userText, hasImage, mode);
    }
    return {
      thought,
      action: p.action || 'chat',
      provider: p.action === 'vision' ? 'gemini' : p.provider || 'gemini',
      search: !!p.search,
    };
  } catch (e) {
    return fallback(userText, hasImage, mode);
  }
}

async function verifyAnswer(question, answer, mode) {
  if (mode !== 'coding' && mode !== 'study') return { ok: true };
  if (!answer || answer.length < 80) return { ok: true };
  const key = getGeminiKey();
  if (!key) return { ok: true };
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json',
      },
    });
    const r = await model.generateContent(
      'You verify an AI answer. Mode=' +
        mode +
        '.\nQuestion: ' +
        String(question).slice(0, 500) +
        '\nAnswer: ' +
        String(answer).slice(0, 6000) +
        '\nJSON only: {"ok":true} OR {"ok":false,"fixed":"corrected full answer in same language/style"}\nFix only if clear factual/code errors. If mostly fine, ok:true.'
    );
    const p = JSON.parse((r.response.text() || '').replace(/```json|```/g, '').trim());
    if (p.ok === false && p.fixed && p.fixed.length > 50) return { ok: false, fixed: p.fixed };
    return { ok: true };
  } catch (e) {
    return { ok: true };
  }
}

module.exports = { think, verifyAnswer };
