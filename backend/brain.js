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
    return { thought: 'Photo dekh ke jawab de raha hoon', action: 'vision', provider: 'gemini', search: false };
  }
  if (/banao|generate image|tasveer|logo bana/.test(t)) {
    return { thought: 'Image generate karni hai', action: 'image', provider: 'flux', search: false };
  }
  if (/news|latest|today|price|2025|2026/.test(t)) {
    return { thought: 'Live info chahiye — search', action: 'chat', provider: 'gemini', search: true };
  }
  return {
    thought: mode === 'coding' ? 'Code carefully soch raha hoon' : mode === 'study' ? 'Concept clear kar raha hoon' : 'Jawab soch raha hoon',
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
      generationConfig: { temperature: 0.1, maxOutputTokens: 120, responseMimeType: 'application/json' },
    });
    const r = await model.generateContent(
      `Route this user message. Mode=\( {mode}. hasImage= \){!!hasImage}. hasFile=${!!hasFile}.
Output ONLY JSON: {"thought":"Hinglish 8 words max what you are doing","action":"chat"|"vision"|"image","provider":"gemini"|"groq","search":false}
Rules: photo+question=vision+gemini; code/study=gemini; casual=groq; image only if user wants picture made.
User: ${userText || '(empty)'}`
    );
    const p = JSON.parse((r.response.text() || '').replace(/```json|```/g, '').trim());
    return {
      thought: (p.thought || 'Soch raha hoon').slice(0, 80),
      action: p.action || 'chat',
      provider: p.action === 'vision' ? 'gemini' : p.provider || 'gemini',
      search: !!p.search,
    };
  } catch (e) {
    return fallback(userText, hasImage, mode);
  }
}

/** Double-check: coding/study answers */
async function verifyAnswer(question, answer, mode) {
  if (mode !== 'coding' && mode !== 'study') return { ok: true };
  if (!answer || answer.length < 80) return { ok: true };
  const key = getGeminiKey();
  if (!key) return { ok: true };
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0, maxOutputTokens: 2000, responseMimeType: 'application/json' },
    });
    const r = await model.generateContent(
      `You verify an AI answer. Mode=${mode}.
Question: ${question.slice(0, 500)}
Answer: ${answer.slice(0, 6000)}
JSON only: {"ok":true} OR {"ok":false,"fixed":"corrected full answer in same language/style"}
Fix only if clear factual/code errors. If mostly fine, ok:true.`
    );
    const p = JSON.parse((r.response.text() || '').replace(/```json|```/g, '').trim());
    if (p.ok === false && p.fixed && p.fixed.length > 50) return { ok: false, fixed: p.fixed };
    return { ok: true };
  } catch (e) {
    return { ok: true };
  }
}

module.exports = { think, verifyAnswer };
