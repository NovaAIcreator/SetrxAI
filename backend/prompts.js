const { GoogleGenerativeAI } = require('@google/generative-ai');

function getGeminiKey() {
  for (let i = 1; i <= 10; i++) {
    const k = process.env['GEMINI_KEYS_' + i];
    if (k && k.trim()) return k.trim();
  }
  return process.env.GEMINI_API_KEY || null;
}

function detectReplyLang(text) {
  const t = String(text || '').trim();
  if (!t) return 'english';
  if (/[\u0900-\u097F]/.test(t)) return 'hindi';
  return 'english';
}

async function detectReplyLangAsync(text) {
  const t = String(text || '').trim();
  if (!t) return 'english';
  if (/[\u0900-\u097F]/.test(t)) return 'hindi';

  const key = getGeminiKey();
  if (!key) return 'english';

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 30,
        responseMimeType: 'application/json',
      },
    });
    const r = await model.generateContent(
      'Classify language. JSON only: {"lang":"english"|"hindi"|"hinglish"}\n' +
        'hindi=Devanagari, hinglish=Hindi in Roman letters, english=English.\nUser: ' +
        t.slice(0, 500)
    );
    const p = JSON.parse((r.response.text() || '').replace(/```json|```/g, '').trim());
    if (p.lang === 'hindi' || p.lang === 'hinglish' || p.lang === 'english') return p.lang;
  } catch (e) {
    console.warn('lang detect', e.message);
  }
  return 'english';
}

function wantsLongForm(text) {
  return /\b(notes|full code|complete file|explain in detail|detailed|step by step|pura code|poora|saari|chapter|essay|write a|replace.*file|entire file|full file|detailed notes|revision notes)\b/i.test(
    String(text || '')
  );
}

function languageLock(lang) {
  if (lang === 'hinglish') {
    return `LANGUAGE LOCK: User wrote Hinglish (Roman). Reply Hinglish only. Zero Devanagari. Code stays English.`;
  }
  if (lang === 'hindi') {
    return `LANGUAGE LOCK: User wrote Hindi Devanagari. Reply in Hindi. Code/names/URLs may stay English.`;
  }
  return `LANGUAGE LOCK: User wrote English. Reply in English only.`;
}

function lengthLock(userText) {
  if (wantsLongForm(userText)) {
    return `LENGTH: Full depth requested. Complete structured answer. No filler.`;
  }
  return `LENGTH: Helpful ChatGPT-depth. Not thin 2-line answers. Greetings only: 1 short line.`;
}

const CORE = `You are SetrxAI — careful, high-trust, strong at coding and reasoning.

ANSWER STRATEGY:
1) Use established knowledge.
2) Use WEB CONTEXT when provided (prefer confirmed sources).
3) Add what is plausibly possible (clearly labeled — not as proven fact).
4) If after knowledge + web + careful reasoning there is still no responsible answer, REFUSE to invent one. Say what is missing.

HARD RULES:
- Do not invent the future.
- No fake full cures or fake proofs of famous open problems.
- Never invent papers, DOIs, APIs, file paths.
- Coding: full paste-ready files, language tags, real paths. No empty stubs.
- Medical: educational only; suggest qualified clinician for personal care.

STYLE: Direct, calm, specific. No hype. **Bold** key terms only.`;

const modePrompts = {
  general:
    CORE +
    `\nConcrete steps, numbers, tradeoffs. Hard problems: known + web + possible; refuse if still empty.`,
  study:
    CORE +
    `\nTutor mode. Why it works, examples, mistakes. Full notes when asked.`,
  coding:
    CORE +
    `\nSenior engineer. Full working files. Edge cases. Prefer React+Node+Tailwind if stack unknown. Explanation matches user language; code in English.`,
};

function buildSystemPrompt(mode, extra, userText) {
  const base = modePrompts[mode] || modePrompts.general;
  const t = String(userText || '').trim();
  const lang = t ? detectReplyLang(t) : 'english';
  const locks = t ? '\n\n' + languageLock(lang) + '\n\n' + lengthLock(t) : '';
  return base + (extra || '') + locks;
}

async function buildSystemPromptAsync(mode, extra, userText) {
  const base = modePrompts[mode] || modePrompts.general;
  const t = String(userText || '').trim();
  const lang = t ? await detectReplyLangAsync(t) : 'english';
  const locks = t ? '\n\n' + languageLock(lang) + '\n\n' + lengthLock(t) : '';
  const reminder =
    lang === 'hinglish'
      ? '\n\nReply Hinglish (Roman only).'
      : lang === 'hindi'
        ? '\n\nReply Hindi Devanagari.'
        : '\n\nReply English.';
  return base + (extra || '') + locks + (t ? reminder : '');
}

modePrompts.buildSystemPrompt = buildSystemPrompt;
modePrompts.buildSystemPromptAsync = buildSystemPromptAsync;
modePrompts.detectReplyLang = detectReplyLang;
modePrompts.detectReplyLangAsync = detectReplyLangAsync;

module.exports = modePrompts;
