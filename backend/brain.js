const { GoogleGenerativeAI } = require('@google/generative-ai');

function getGeminiKey() {
  for (let i = 1; i <= 10; i++) {
    const k = process.env['GEMINI_KEYS_' + i];
    if (k && k.trim()) return k.trim();
  }
  return null;
}

function fallback(userText, hasImage, mode) {
  const t = (userText || '').toLowerCase();
  if (hasImage && !/banao|edit|improve|accha|image|logo/.test(t)) {
    return {
      thought: 'Reading the photo',
      action: 'vision',
      provider: 'gemini',
      search: false,
    };
  }
  if (/banao|generate image|tasveer|logo bana/.test(t)) {
    return {
      thought: 'Preparing an image',
      action: 'image',
      provider: 'flux',
      search: false,
    };
  }
  if (/news|latest|today|price|2025|2026/.test(t)) {
    return {
      thought: 'Looking up current information',
      action: 'chat',
      provider: 'gemini',
      search: true,
    };
  }
  return {
    thought:
      mode === 'coding'
        ? 'Working through the code'
        : mode === 'study'
        ? 'Working through the concept'
        : 'Thinking through this',
    action: 'chat',
    provider: mode === 'general' ? 'groq' : 'gemini',
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
        temperature: 0.1,
        maxOutputTokens: 120,
        responseMimeType: 'application/json',
      },
    });
    const r = await model.generateContent(
      'Route this user message. Mode=' +
        mode +
        '. hasImage=' +
        !!hasImage +
        '. hasFile=' +
        !!hasFile +
        '.\nOutput ONLY JSON: {"thought":"English, max 6 words, no emoji, what you are doing now","action":"chat"|"vision"|"image","provider":"gemini"|"groq","search":false}\nRules: photo+question=vision+gemini; code/study=gemini; casual=groq; image only if user wants a picture made. thought examples: Thinking through this | Reading the photo | Looking up current information | Working through the code\nUser: ' +
        (userText || '(empty)')
    );
    const p = JSON.parse((r.response.text() || '').replace(/```json|```/g, '').trim());
    return {
      thought: String(p.thought || 'Thinking through this')
        .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
        .trim()
        .slice(0, 60),
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
