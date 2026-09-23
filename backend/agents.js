const { GoogleGenerativeAI } = require('@google/generative-ai');
const { searchWeb } = require('./searchIntent');

function getGeminiKey() {
  for (let i = 1; i <= 10; i++) {
    const k = process.env['GEMINI_KEYS_' + i];
    if (k && k.trim()) return k.trim();
  }
  return process.env.GEMINI_API_KEY || null;
}

function clip(s, n) {
  n = n || 80;
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : t.slice(0, n) + '…';
}

async function planAgents(opts) {
  const userText = opts.userText;
  const mode = opts.mode;
  const hasFile = opts.hasFile;
  const fileName = opts.fileName;
  const hasImage = opts.hasImage;

  const fallback = {
    scout: false,
    lab: false,
    searchQuery: '',
    labGoal: '',
    scoutThoughts: ['No web lookup'],
    labThoughts: ['No experiment'],
    writerThoughts: ['Drafting answer'],
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

    const prompt =
      'You are the routing brain for SetrxAI multi-agent system.\n' +
      'Mode=' +
      mode +
      '. hasFile=' +
      !!hasFile +
      '. fileName=' +
      (fileName || 'none') +
      '. hasImage=' +
      !!hasImage +
      '.\n\n' +
      'Decide from MEANING (not keyword lists):\n' +
      '- scout=true when web/current facts, GitHub, news, prices, products, verify online helps\n' +
      '- lab=true for deep problem-solving, research, design, coding implementation, invention framing, hard questions\n' +
      '- hi/thanks → both false\n' +
      '- show github/repo → scout true; write/fix code → lab true\n\n' +
      'JSON only:\n' +
      '{"scout":boolean,"lab":boolean,"searchQuery":"short or empty","labGoal":"one line or empty",' +
      '"scoutThoughts":["2-4 short specific status lines"],' +
      '"labThoughts":["2-4 short specific lines"],' +
      '"writerThoughts":["2-3 short lines"]}\n' +
      'No emojis. Mention real topic from user message.\n\n' +
      'User message:\n' +
      (userText || '(empty)');

    const r = await model.generateContent(prompt);
    const raw = (r.response.text() || '').replace(/```json|```/g, '').trim();
    const p = JSON.parse(raw);

    return {
      scout: !!p.scout,
      lab: !!p.lab,
      searchQuery: String(p.searchQuery || '').slice(0, 200),
      labGoal: String(p.labGoal || '').slice(0, 200),
      scoutThoughts: Array.isArray(p.scoutThoughts)
        ? p.scoutThoughts.map(String).slice(0, 5)
        : fallback.scoutThoughts,
      labThoughts: Array.isArray(p.labThoughts)
        ? p.labThoughts.map(String).slice(0, 5)
        : fallback.labThoughts,
      writerThoughts: Array.isArray(p.writerThoughts)
        ? p.writerThoughts.map(String).slice(0, 4)
        : fallback.writerThoughts,
    };
  } catch (e) {
    console.error('planAgents', e.message);
    return fallback;
  }
}

async function runScout(opts) {
  const searchQuery = opts.searchQuery;
  const userText = opts.userText;
  const onProgress = opts.onProgress;
  const q = String(searchQuery || userText || '').trim();

  if (!q) {
    if (onProgress) onProgress({ detail: 'Idle', line: 'No search query' });
    return { sources: [], context: '', checks: [] };
  }

  if (onProgress) onProgress({ detail: 'Searching', line: 'Query: ' + clip(q, 70) });

  try {
    const data = await searchWeb(q);
    if (!data || !data.context) {
      if (onProgress) onProgress({ detail: 'No results', line: 'Empty for: ' + clip(q, 50) });
      return { sources: [], context: '', checks: [{ note: 'No web results' }] };
    }
    const titles = (data.sources || [])
      .slice(0, 3)
      .map(function (s) {
        return s.title;
      })
      .join(' · ');
    if (onProgress) onProgress({ detail: 'Sources ready', line: titles || 'Context packed' });
    return {
      sources: data.sources || [],
      context: data.context || '',
      checks: [{ note: 'Tavily live search' }],
    };
  } catch (e) {
    if (onProgress) onProgress({ detail: 'Search failed', line: e.message || 'error' });
    return { sources: [], context: '', checks: [{ note: 'Search error' }] };
  }
}

/** 3-pass Lab: known + web + possible → critique → refine; refuse if still empty */
async function runLab(opts) {
  const userText = opts.userText;
  const labGoal = opts.labGoal;
  const mode = opts.mode;
  const scoutContext = opts.scoutContext;
  const onProgress = opts.onProgress;

  const key = getGeminiKey();
  if (!key) {
    if (onProgress) onProgress({ detail: 'Lab skipped', line: 'No API key' });
    return { notes: '' };
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { temperature: 0.4, maxOutputTokens: 1400 },
  });

  const ctx = scoutContext ? String(scoutContext).slice(0, 3500) : '';
  const goal = labGoal || userText;

  if (onProgress) {
    onProgress({ detail: 'Lab · Propose', line: 'Known + possible for: ' + clip(goal, 55) });
  }

  const proposeRes = await model.generateContent(
    'You are Lab-Propose for SetrxAI. Mode=' +
      mode +
      '.\n' +
      'Combine: (1) established knowledge (2) web context if any (3) what is plausibly possible.\n' +
      'TRY hard to be useful. If the problem is open/unsolved, do NOT claim a full solution or medical cure.\n' +
      'Give strongest known results, partial strategies, constraints, next experiments.\n' +
      'For coding: solid approach, edge cases, structure — real code ideas, not stubs only.\n\n' +
      'Goal: ' +
      goal +
      '\nUser: ' +
      userText +
      '\n' +
      (ctx ? 'Web context:\n' + ctx : '')
  );
  const proposal = (proposeRes.response.text() || '').trim();

  if (onProgress) onProgress({ detail: 'Lab · Critique', line: 'Checking overclaims and gaps' });

  const critiqueRes = await model.generateContent(
    'You are Lab-Critique for SetrxAI.\n' +
      'Find holes, overclaims, missing constraints.\n' +
      'Flag anything that pretends an unsolved problem is fully solved or invents a cure.\n' +
      'Short harsh constructive bullets.\n\nProposal:\n' +
      proposal.slice(0, 6000)
  );
  const critique = (critiqueRes.response.text() || '').trim();

  if (onProgress) {
    onProgress({ detail: 'Lab · Refine', line: 'Merge + decide if answerable' });
  }

  const refineRes = await model.generateContent(
    'You are Lab-Refine for SetrxAI. FINAL notes for Writer.\n' +
      'Rules:\n' +
      '- Merge known facts + confirmed web signals + plausible options\n' +
      '- Apply critique; remove false certainty\n' +
      '- If after all this there is still no responsible answer, say clearly: INSUFFICIENT — Writer must decline inventing one\n' +
      '- Never invent papers, trial IDs, or formal proofs of open problems\n' +
      '- Coding tasks: concrete structure Writer can turn into full files\n' +
      'Sections: Known | Web-supported | Plausible next steps | Limits / refuse if needed\n\n' +
      'Proposal:\n' +
      proposal.slice(0, 4000) +
      '\n\nCritique:\n' +
      critique.slice(0, 2500) +
      '\n\nUser goal: ' +
      goal
  );
  const notes = (refineRes.response.text() || '').trim();

  if (onProgress) {
    onProgress({ detail: 'Lab done', line: 'Notes ready (' + notes.length + ' chars)' });
  }
  return { notes: notes, proposal: proposal, critique: critique };
}

module.exports = { planAgents: planAgents, runScout: runScout, runLab: runLab };
