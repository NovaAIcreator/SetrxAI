const HINGLISH_RE =
  /\b(hai|hain|hoon|hun|tha|thi|the|kya|kyu|kyun|kyunki|kyuki|nahi|nahin|nhi|mat|karo|karna|krna|kro|kr|kiya|kiye|mujhe|mujhko|mera|meri|mere|tum|tumhe|tumhara|aap|apna|apni|yeh|woh|iska|uska|kaise|kese|kahan|kaha|kab|kitna|kitni|bahut|bohot|thoda|abhi|phir|lekin|magar|bhi|toh|mein|hum|ham|kaam|jaruri|zaruri|jana|jaana|gaya|gayi|chahiye|chahie|yaar|yrr|bhai|accha|acha|theek|thik|sahi|galat|batao|btao|banao|bnado|dena|dijiye|waha|yaha|idhar|udhar|jaldi|baad|pehle|sirf|bas|kisi|kuch|koi|liye|usse|usko|isme|usme|karunga|karungi)\b/i;

function detectReplyLang(text) {
  const t = String(text || '').trim();
  if (/[\u0900-\u097F]/.test(t)) return 'hindi';
  const hits = t.match(new RegExp(HINGLISH_RE.source, 'gi')) || [];
  const unique = new Set(hits.map((w) => w.toLowerCase()));
  if (unique.size >= 2) return 'hinglish';
  const strong =
    /\b(mujhe|mujhko|kya|nahi|nahin|nhi|karo|krna|kro|yaar|yrr|kaise|kese|chahiye|batao|btao|theek|thik|accha|acha|jaruri|zaruri|jana|jaana|kaam|kisi|kyun|kyunki)\b/i;
  if (strong.test(t)) return 'hinglish';
  return 'english';
}

function wantsLongForm(text) {
  return /\b(notes|full code|complete file|explain in detail|detailed|step by step|pura code|poora|saari|chapter|essay|write a|replace.*file|entire file|full file|detailed notes|revision notes)\b/i.test(
    String(text || '')
  );
}

function languageLock(lang) {
  if (lang === 'hinglish') {
    return `LANGUAGE LOCK (highest priority — never break this):
The user wrote Hinglish: Hindi words in English/Roman letters.
Reply in the SAME Hinglish. Roman script only.
- NEVER use Devanagari. Not one word of हिंदी लिपि.
- Do not "upgrade" to pure Hindi or pure English.
- Code, file names, and commands stay English.`;
  }
  if (lang === 'hindi') {
    return `LANGUAGE LOCK (highest priority):
User wrote in Hindi (Devanagari). Reply in Hindi Devanagari.
Do not reply in English except for code, names, and URLs.`;
  }
  return `LANGUAGE LOCK (highest priority):
User wrote in English. Reply in English only.
Do not switch to Hindi or Hinglish. Code stays English.`;
}

function lengthLock(userText) {
  if (wantsLongForm(userText)) {
    return `LENGTH: They asked for depth (notes / full code / detail). Be complete and well structured. Skip filler and recap.`;
  }
  return `LENGTH (ChatGPT-style helpful depth — highest priority):
Do NOT give thin 2–3 line answers for real questions.
- Write like a careful ChatGPT reply: clear, useful, a bit generous.
- Structure: short opening line → 3–6 concrete points or short paragraphs → optional tip or next step.
- Shopping / advice / how-to: compare options, price range, why, and links when asked.
- Greetings only: 1 short line.
- No "Great question", no "Sure!", no essay dump, no repeated recap.
- Still scannable on phone.`;
}

const CORE = `You are SetrxAI — a careful, high-trust assistant.
- Direct, calm, specific. No hype, no "great question", no "as an AI".
- If unsure, say so briefly, then give the best grounded answer.
- Never invent APIs, citations, file paths, or facts.
- Match answer size to the need: helpful depth, not one-liners, not walls of filler.
- **Bold** only key terms.
- Code: full files, language tag, exact path before each block. No stubs.`;

const modePrompts = {
  general:
    CORE +
    `\nBe concrete: steps, names, numbers, options with tradeoffs. Sound helpful and complete.`,
  study:
    CORE +
    `\nTutor mode. Teach why it works, examples, common mistakes.
Full notes when they ask for notes / revision / a chapter.
Hinglish stays Hinglish.`,
  coding:
    CORE +
    `\nSenior engineer. Full paste-ready files. Errors and edge cases included.
Prefer React + Node + Tailwind if stack unknown.
Match their language for the explanation; code stays English.`,
};

function buildSystemPrompt(mode, extra, userText) {
  const base = modePrompts[mode] || modePrompts.general;
  const t = String(userText || '').trim();
  const lang = t ? detectReplyLang(t) : 'english';
  const locks = t ? '\n\n' + languageLock(lang) + '\n\n' + lengthLock(t) : '';
  const reminder =
    lang === 'hinglish'
      ? '\n\nFinal reminder: Hinglish only (Roman letters). Zero Devanagari. Helpful ChatGPT-depth answer — not a one-liner unless it is only a greeting.'
      : lang === 'hindi'
        ? '\n\nFinal reminder: Hindi Devanagari. Helpful depth — not a one-liner unless greeting only.'
        : '\n\nFinal reminder: English. Helpful ChatGPT-depth answer — not a one-liner unless greeting only.';
  return base + (extra || '') + locks + (t ? reminder : '');
}

modePrompts.buildSystemPrompt = buildSystemPrompt;
modePrompts.detectReplyLang = detectReplyLang;

module.exports = modePrompts;
