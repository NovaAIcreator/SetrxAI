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
  if (!t) return { lang: 'english', label: 'English', script: 'latin' };

  if (/[\u0900-\u097F]/.test(t)) {
    return { lang: 'hindi', label: 'Hindi (Devanagari)', script: 'devanagari' };
  }
  if (/[\u0600-\u06FF]/.test(t)) {
    return { lang: 'arabic', label: 'Arabic/Urdu script', script: 'arabic' };
  }
  if (/[\u0A80-\u0AFF]/.test(t)) {
    return { lang: 'gujarati', label: 'Gujarati', script: 'gujarati' };
  }
  if (/[\u0B80-\u0BFF]/.test(t)) {
    return { lang: 'tamil', label: 'Tamil', script: 'tamil' };
  }
  if (/[\u0C00-\u0C7F]/.test(t)) {
    return { lang: 'telugu', label: 'Telugu', script: 'telugu' };
  }
  if (/[\u0C80-\u0CFF]/.test(t)) {
    return { lang: 'kannada', label: 'Kannada', script: 'kannada' };
  }
  if (/[\u0D00-\u0D7F]/.test(t)) {
    return { lang: 'malayalam', label: 'Malayalam', script: 'malayalam' };
  }
  if (/[\u0980-\u09FF]/.test(t)) {
    return { lang: 'bengali', label: 'Bengali', script: 'bengali' };
  }
  if (/[\u4E00-\u9FFF]/.test(t)) {
    return { lang: 'chinese', label: 'Chinese', script: 'han' };
  }
  if (/[\u3040-\u30FF]/.test(t)) {
    return { lang: 'japanese', label: 'Japanese', script: 'japanese' };
  }
  if (/[\uAC00-\uD7AF]/.test(t)) {
    return { lang: 'korean', label: 'Korean', script: 'hangul' };
  }
  if (/[\u0400-\u04FF]/.test(t)) {
    return { lang: 'russian', label: 'Russian', script: 'cyrillic' };
  }

  return { lang: 'english', label: 'English', script: 'latin' };
}

async function detectReplyLangAsync(text) {
  const t = String(text || '').trim();
  if (!t) return { lang: 'english', label: 'English', script: 'latin' };

  const heuristic = detectReplyLang(t);
  const key = getGeminiKey();
  if (!key) return heuristic;

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 80,
        responseMimeType: 'application/json',
      },
    });
    const r = await model.generateContent(
      'Detect the language of the user message. Support ANY language or mix.\n' +
        'JSON only:\n' +
        '{"lang":"short_id","label":"Human name","mixed":true|false}\n' +
        'Examples of lang: english, hindi, hinglish, urdu, spanish, french, german, arabic, ' +
        'bengali, tamil, telugu, chinese, japanese, korean, russian, portuguese, indonesian, ...\n' +
        'hinglish = Hindi meaning in Roman letters.\n' +
        'If mixed, set mixed true and lang = dominant reply language to use.\n' +
        'User:\n' +
        t.slice(0, 800)
    );
    const p = JSON.parse((r.response.text() || '').replace(/```json|```/g, '').trim());
    if (p && p.lang) {
      return {
        lang: String(p.lang).toLowerCase().slice(0, 40),
        label: String(p.label || p.lang).slice(0, 80),
        script: heuristic.script,
        mixed: !!p.mixed,
      };
    }
  } catch (e) {
    console.warn('lang detect', e.message);
  }
  return heuristic;
}

function wantsLongForm(text) {
  return /\b(notes|full code|complete file|explain in detail|detailed|step by step|pura code|poora|saari|chapter|essay|write a|replace.*file|entire file|full file|detailed notes|revision notes)\b/i.test(
    String(text || '')
  );
}

function languageLock(langInfo) {
  const info =
    typeof langInfo === 'string'
      ? { lang: langInfo, label: langInfo }
      : langInfo || { lang: 'english', label: 'English' };

  const lang = info.lang || 'english';
  const label = info.label || lang;

  if (lang === 'hinglish') {
    return (
      'LANGUAGE LOCK (highest priority — never break):\n' +
      'User wrote Hinglish (Hindi in Roman letters).\n' +
      'Reply ONLY in Hinglish — Roman script. Zero Devanagari.\n' +
      'Do NOT switch to pure English or pure Hindi.\n' +
      'Code, file paths, URLs, API names stay English.'
    );
  }
  if (lang === 'hindi') {
    return (
      'LANGUAGE LOCK (highest priority — never break):\n' +
      'User wrote Hindi (Devanagari). Reply in Hindi Devanagari.\n' +
      'Do NOT reply only in English except code/URLs/names.'
    );
  }
  if (lang === 'english') {
    return (
      'LANGUAGE LOCK (highest priority — never break):\n' +
      'User wrote English. Reply in English only.\n' +
      'Do not switch to Hindi/Hinglish unless user did.'
    );
  }

  return (
    'LANGUAGE LOCK (highest priority — never break):\n' +
    'User language detected: ' +
    label +
    ' (id=' +
    lang +
    ').\n' +
    'You MUST reply in that same language.\n' +
    'Match their script and formality. Do not translate the whole answer into English unless they wrote English.\n' +
    'Code, file paths, URLs, and technical identifiers stay in English as usual.\n' +
    'If the message mixes languages, follow the dominant user language for the reply.'
  );
}

function lengthLock(userText) {
  if (wantsLongForm(userText)) {
    return 'LENGTH: Full depth requested. Complete structured answer. No filler.';
  }
  return 'LENGTH: Helpful ChatGPT-depth. Not thin 2-line answers. Greetings only: 1 short line.';
}

const CORE = `You are SetrxAI — careful, high-trust, truth-first assistant.

ANSWER STRATEGY:
1) Prefer verified knowledge and WEB CONTEXT (when provided). Cite real links from context.
2) If something is uncertain, say so in plain words — do not fill gaps with guesses presented as fact.
3) "Plausible" ideas are allowed ONLY when clearly labeled as possibility / opinion, never as established fact.
4) If you cannot support an answer with knowledge or sources, refuse to invent. Say what is missing.

ZERO FABRICATION (applies to EVERY topic — not only GitHub):
- Do NOT invent: file trees, folder structures, function names, class names, API routes, env vars, database schemas, config files, or "example" code that pretends to be from a real project you have not been given.
- Do NOT invent: papers, authors, DOIs, statistics, prices, dates, product specs, company internals, or quotes.
- Do NOT invent: screenshots, "I opened the repo and saw…", or step-by-step claims about private systems.
- If the user asks what is inside a repo/app/file and you do not have that content in context/search: say you don't have the file text; give only the real public URL + high-level facts you actually know; invite them to paste a file.
- Writing NEW code the user asked you to create is allowed and should be complete — that is authorship, not pretending it already existed in their repo.
- Medical / science: educational framing; no fake cures or fake trial results.
- Never claim you browsed a site if search context was empty.

LANGUAGE: Match the user's language (any language or mix). Do not default to English when they used another language.

STYLE: Direct, calm, specific. No hype. **Bold** only key terms. Prefer fewer true statements over many decorative false ones.
`;

const modePrompts = {
  general:
    CORE +
    '\nConcrete steps, numbers, tradeoffs. Hard problems: known + web + possible; refuse if still empty.',
  study:
    CORE +
    '\nTutor mode. Why it works, examples, mistakes. Full notes when asked. Same language as user.',
  coding:
    CORE +
    '\nSenior engineer. NEW code the user requested: full working files + edge cases. Describing an existing project/repo: only real structure from context/knowledge — never fabricate files. Prefer React+Node+Tailwind if stack unknown for new apps.',
};

function buildSystemPrompt(mode, extra, userText) {
  const base = modePrompts[mode] || modePrompts.general;
  const t = String(userText || '').trim();
  const langInfo = t ? detectReplyLang(t) : { lang: 'english', label: 'English' };
  const locks = t ? '\n\n' + languageLock(langInfo) + '\n\n' + lengthLock(t) : '';
  return base + (extra || '') + locks;
}

async function buildSystemPromptAsync(mode, extra, userText) {
  const base = modePrompts[mode] || modePrompts.general;
  const t = String(userText || '').trim();
  const langInfo = t
    ? await detectReplyLangAsync(t)
    : { lang: 'english', label: 'English' };
  const locks = t ? '\n\n' + languageLock(langInfo) + '\n\n' + lengthLock(t) : '';
  const reminder =
    '\n\nFINAL REMINDERS:\n' +
    '- Reply in ' +
    (langInfo.label || langInfo.lang) +
    '. Do not switch language.\n' +
    '- Facts only. No fabricated structure, code-from-repo, stats, or sources.\n' +
    '- If context is missing, say so. Code identifiers stay English.';
  return base + (extra || '') + locks + (t ? reminder : '');
}

modePrompts.buildSystemPrompt = buildSystemPrompt;
modePrompts.buildSystemPromptAsync = buildSystemPromptAsync;
modePrompts.detectReplyLang = detectReplyLang;
modePrompts.detectReplyLangAsync = detectReplyLangAsync;
modePrompts.languageLock = languageLock;

module.exports = modePrompts;
