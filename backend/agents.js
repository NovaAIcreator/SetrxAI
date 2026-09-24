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

/** Rescues when LLM wrongly turns scout/lab off */
function safetyNetPlan(userText, plan, mode) {
  const t = String(userText || '').toLowerCase();
  const out = Object.assign({}, plan);

  const clearlyNeedsWeb =
    /github|repo|repository|gitlab|bitbucket/.test(t) ||
    /\b(search|dhundo|dhoondo|dhoondho|google|browse|look up|lookup|find online|internet|web se)\b/.test(t) ||
    /\b(latest|current|today|price|news|stock|weather|who is|kya hai)\b/.test(t) ||
    /\b(setrxai|setrx ai|setrx)\b/.test(t) ||
    /\b(docs|documentation|official site|website|url|link do)\b/.test(t) ||
    /\b(code dekho|source code|pura code|sare codes|saare codes)\b/.test(t);

  const clearlyNeedsLab =
    mode === 'coding' ||
    /\b(lab|experiment|invent|design system|architecture|implement|refactor)\b/.test(t) ||
    /\b(cure|ilaj|vaccine|treatment|cancer|unsolved|prove|derive|hypothesis)\b/.test(t) ||
    /\b(full code|complete file|banao|build me|write a|fix this)\b/.test(t) ||
    /\b(deep|research|strategy|roadmap|brainstorm|soch ke|analyze deeply)\b/.test(t);

  if (clearlyNeedsWeb && !out.scout) {
    out.scout = true;
    out.searchQuery = (out.searchQuery || userText || '').slice(0, 200);
    out.scoutThoughts = [
      'Web lookup required',
      'Query: ' + clip(out.searchQuery || userText, 70),
    ];
  }

  if (/\b(setrxai|setrx)\b/.test(t) || (/github/.test(t) && /repo|code|source/.test(t))) {
    out.scout = true;
    if (!out.searchQuery || out.searchQuery.length < 8) {
      out.searchQuery = /setrx/.test(t)
        ? 'SetrxAI GitHub NovaAIcreator SetrxAI repository'
        : clip(userText, 120);
    }
    out.scoutThoughts = [
      'Searching GitHub / web',
      'Query: ' + clip(out.searchQuery, 70),
    ];
  }

  if (clearlyNeedsLab && !out.lab) {
    out.lab = true;
    out.labGoal = (out.labGoal || userText || '').slice(0, 200);
    out.labThoughts = [
      'Deep work / experiment',
      'Goal: ' + clip(out.labGoal || userText, 70),
    ];
  }

  if (!out.writerThoughts || !out.writerThoughts.length) {
    out.writerThoughts = ['Drafting answer', 'Using Scout/Lab context if any'];
  }

  return out;
}

async function planAgents(opts) {
  const userText = opts.userText;
  const mode = opts.mode;
  const hasFile = opts.hasFile;
  const fileName = opts.fileName;
  const hasImage = opts.hasImage;

  const empty = {
    scout: false,
    lab: false,
    searchQuery: '',
    labGoal: '',
    scoutThoughts: ['No web lookup'],
    labThoughts: ['No experiment'],
    writerThoughts: ['Drafting answer'],
  };

  let plan = empty;
  const key = getGeminiKey();

  if (key) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
          responseMimeType: 'application/json',
        },
      });

      const prompt =
        'You route tools for SetrxAI. Be GENEROUS with scout/lab when useful.\n' +
        'Mode=' +
        mode +
        ' hasFile=' +
        !!hasFile +
        ' fileName=' +
        (fileName || 'none') +
        ' hasImage=' +
        !!hasImage +
        '\n\n' +
        'RULES:\n' +
        '1) scout=true if: GitHub, repo, web code, SetrxAI, search, prices, news, docs, dhundo, current facts.\n' +
        '2) lab=true if: write/fix code, experiment, research, hard problem, design, deep analysis.\n' +
        '3) Both false ONLY for hi/thanks/bye.\n' +
        '4) GitHub/repo/codes → scout MUST true. Good searchQuery.\n' +
        '5) Hinglish same (dhundo, batao, code dekho).\n\n' +
        'JSON only:\n' +
        '{"scout":boolean,"lab":boolean,"searchQuery":"string","labGoal":"string",' +
        '"scoutThoughts":["2-4 short lines"],"labThoughts":["2-4 short lines"],"writerThoughts":["2-3 short lines"]}\n\n' +
        'User:\n' +
        (userText || '(empty)');

      const r = await model.generateContent(prompt);
      const raw = (r.response.text() || '').replace(/```json|```/g, '').trim();
      const p = JSON.parse(raw);

      plan = {
        scout: !!p.scout,
        lab: !!p.lab,
        searchQuery: String(p.searchQuery || '').slice(0, 200),
        labGoal: String(p.labGoal || '').slice(0, 200),
        scoutThoughts: Array.isArray(p.scoutThoughts)
          ? p.scoutThoughts.map(String).slice(0, 5)
          : empty.scoutThoughts,
        labThoughts: Array.isArray(p.labThoughts)
          ? p.labThoughts.map(String).slice(0, 5)
          : empty.labThoughts,
        writerThoughts: Array.isArray(p.writerThoughts)
          ? p.writerThoughts.map(String).slice(0, 4)
          : empty.writerThoughts,
      };
    } catch (e) {
      console.error('planAgents LLM failed:', e.message);
      plan = empty;
    }
  } else {
    console.warn('planAgents: no Gemini key — safety net only');
  }

  return safetyNetPlan(userText, plan, mode);
}

async function runScout(opts) {
  const searchQuery = opts.searchQuery;
  const userText = opts.userText;
  const onProgress = opts.onProgress;
  let q = String(searchQuery || userText || '').trim();

  const lower = (userText || '').toLowerCase();
  if (/\b(setrxai|setrx)\b/.test(lower) && /github|repo|code|source/.test(lower)) {
    q = 'SetrxAI GitHub NovaAIcreator/SetrxAI repository';
  }

  if (!q) {
    if (onProgress) onProgress({ detail: 'Idle', line: 'No search query' });
    return { sources: [], context: '', checks: [] };
  }

  if (onProgress) onProgress({ detail: 'Searching', line: 'Query: ' + clip(q, 70) });

  try {
    const data = await searchWeb(q);
    if (!data || !data.context) {
      if (q !== userText && userText) {
        if (onProgress) onProgress({ detail: 'Retry', line: 'Broader: ' + clip(userText, 60) });
        const data2 = await searchWeb(String(userText).slice(0, 200));
        if (data2 && data2.context) {
          if (onProgress) {
            onProgress({
              detail: 'Sources ready',
              line: (data2.sources || [])
                .slice(0, 3)
                .map(function (s) {
                  return s.title;
                })
                .join(' · '),
            });
          }
          return {
            sources: data2.sources || [],
            context: data2.context || '',
            checks: [{ note: 'Tavily retry' }],
          };
        }
      }
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
    return { sources: [], context: '', checks: [{ note: 'Search error: ' + (e.message || '') }] };
  }
}

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
      'Combine known + web + possible. No fake cures/proofs.\n' +
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
    'Lab-Critique. Find holes. Short bullets.\n\nProposal:\n' + proposal.slice(0, 6000)
  );
  const critique = (critiqueRes.response.text() || '').trim();

  if (onProgress) {
    onProgress({ detail: 'Lab · Refine', line: 'Merge + decide if answerable' });
  }

  const refineRes = await model.generateContent(
    'Lab-Refine FINAL notes for Writer. If empty say INSUFFICIENT.\n' +
      'Proposal:\n' +
      proposal.slice(0, 4000) +
      '\nCritique:\n' +
      critique.slice(0, 2500) +
      '\nGoal: ' +
      goal
  );
  const notes = (refineRes.response.text() || '').trim();

  if (onProgress) {
    onProgress({ detail: 'Lab done', line: 'Notes ready (' + notes.length + ' chars)' });
  }
  return { notes: notes, proposal: proposal, critique: critique };
}

module.exports = { planAgents: planAgents, runScout: runScout, runLab: runLab };
