// backend/agents.js
// LLM decides Scout / Lab / Writer — no keyword lists for meaning

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { searchWeb } = require('./searchIntent');

function getGeminiKey() {
  for (let i = 1; i <= 10; i++) {
    const k = process.env['GEMINI_KEYS_' + i];
    if (k && k.trim()) return k.trim();
  }
  return process.env.GEMINI_API_KEY || null;
}

function clip(s, n = 80) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : t.slice(0, n) + '…';
}

/** LLM plans agents from the real user message (any wording) */
async function planAgents({ userText, mode, hasFile, fileName, hasImage }) {
  const fallback = {
    scout: false,
    lab: false,
    searchQuery: '',
    labGoal: '',
    scoutThoughts: ['No web lookup planned'],
    labThoughts: ['No experiment planned'],
    writerThoughts: ['Drafting a direct answer'],
  };

  const key = getGeminiKey();
  if (!key) return fallback;

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 500,
        responseMimeType: 'application/json',
      },
    });

    const prompt = `You are the routing brain for SetrxAI (multi-agent).
Mode=\( {mode}. hasFile= \){!!hasFile}. fileName=\( {fileName || 'none'}. hasImage= \){!!hasImage}.

Decide tools from MEANING, not fixed keywords.
- scout=true when outside/current facts, products, GitHub, news, prices, "who is", company, or verifying the web helps.
- lab=true when the user wants invention, cure/research directions, design, deep problem-solving, coding implementation, experiments, strategy — even if they use different words (e.g. ilaj, solution, nikalo, how to solve).
- Simple hi/thanks → both false.
- GitHub "show me the repo/code" → scout true, lab false unless they ask to write/fix code.

Output ONLY JSON:
{
  "scout": boolean,
  "lab": boolean,
  "searchQuery": "best short web query or empty",
  "labGoal": "one line what Lab should explore or empty",
  "scoutThoughts": ["2-4 short live status lines in English, specific to THIS message, no ellipsis spam"],
  "labThoughts": ["2-4 short live status lines, specific", "..."] ,
  "writerThoughts": ["2-3 short lines", "..."]
}

Rules for thoughts:
- Mention real topic from the user message
- If fileName set, Scout may mention reading that file
- No emojis, no "..." chains, no generic "Checking if..."

User message:
${userText || '(empty)'}`;

    const r = await model.generateContent(prompt);
    const raw = (r.response.text() || '').replace(/```json|```/g, '').trim();
    const p = JSON.parse(raw);

    return {
      scout: !!p.scout,
      lab: !!p.lab,
      searchQuery: String(p.searchQuery || '').slice(0, 200),
      labGoal: String(p.labGoal || '').slice(0, 200),
      scoutThoughts: Array.isArray(p.scoutThoughts) ? p.scoutThoughts.map(String).slice(0, 5) : fallback.scoutThoughts,
      labThoughts: Array.isArray(p.labThoughts) ? p.labThoughts.map(String).slice(0, 5) : fallback.labThoughts,
      writerThoughts: Array.isArray(p.writerThoughts) ? p.writerThoughts.map(String).slice(0, 4) : fallback.writerThoughts,
    };
  } catch (e) {
    console.error('planAgents', e.message);
    return fallback;
  }
}

/** Run Scout: real Tavily search */
async function runScout({ searchQuery, userText, onProgress }) {
  const q = (searchQuery || userText || '').trim();
  if (!q) {
    onProgress?.({ detail: 'No query', line: 'Scout idle' });
    return { sources: [], context: '' };
  }

  onProgress?.({ detail: 'Searching', line: 'Query: ' + clip(q, 70) });

  try {
    const formatted = await searchWeb(q);
    if (!formatted) {
      onProgress?.({ detail: 'No results', line: 'Empty web results for: ' + clip(q, 50) });
      return { sources: [], context: '' };
    }

    // Parse rough sources from tavily-style block if needed; also return raw context for Writer
    onProgress?.({ detail: 'Sources ready', line: 'Packed web context for Writer' });
    return {
      sources: [], // optional: parse titles/urls if you extend searchWeb to return objects
      context: formatted,
      checks: [{ note: 'Live web via Tavily' }],
    };
  } catch (e) {
    onProgress?.({ detail: 'Search failed', line: e.message || 'Tavily error' });
    return { sources: [], context: '', checks: [{ note: 'Search error' }] };
  }
}

/** Run Lab: structured experiment notes (LLM) — not fake code */
async function runLab({ userText, labGoal, mode, scoutContext, onProgress }) {
  const key = getGeminiKey();
  if (!key) {
    onProgress?.({ detail: 'Lab skipped', line: 'No API key' });
    return { notes: '' };
  }

  onProgress?.({ detail: 'Lab running', line: labGoal ? 'Goal: ' + clip(labGoal, 70) : 'Goal: ' + clip(userText, 70) });

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.4, maxOutputTokens: 900 },
    });

    const r = await model.generateContent(
      `You are Lab agent for SetrxAI. Mode=${mode}.
Do a careful thought experiment / research framing / solution design.
Be honest: no fake cures, no invented papers.
Output plain text notes (bullets ok), max \~400 words, for the Writer agent.

Lab goal: ${labGoal || userText}
User message: ${userText}
${scoutContext ? '\nWeb context:\n' + String(scoutContext).slice(0, 3000) : ''}`
    );

    const notes = (r.response.text() || '').trim();
    onProgress?.({ detail: 'Lab done', line: 'Notes length ' + notes.length + ' chars' });
    return { notes };
  } catch (e) {
    onProgress?.({ detail: 'Lab failed', line: e.message || 'error' });
    return { notes: '' };
  }
}

module.exports = { planAgents, runScout, runLab };
