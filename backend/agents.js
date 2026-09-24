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

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error((label || 'op') + ' timeout ' + ms + 'ms')),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function safetyNetPlan(userText, plan, mode) {
  const t = String(userText || '').toLowerCase();
  const out = Object.assign({}, plan);

  const clearlyNeedsWeb =
    /github|repo|repository|gitlab|bitbucket/.test(t) ||
    /\b(search|dhundo|dhoondo|dhoondho|google|browse|look up|lookup|find online|internet|web se)\b/.test(t) ||
    /\b(latest|current|today|price|news|stock|weather|who is|kya hai)\b/.test(t) ||
    /\b(setrxai|setrx ai|setrx)\b/.test(t) ||
    /\b(docs|documentation|official site|website|url|link do)\b/.test(t) ||
    /\b(code dekho|source code|pura code|sare codes|saare codes)\b/.test(t) ||
    /\b(cancer|ilaj|treatment|vaccine|medicine|drug|clinical|research paper)\b/.test(t);

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
      'Web needed: ' + clip(userText, 50),
      'Search query: ' + clip(out.searchQuery, 70),
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
      'GitHub / project lookup',
      'Search query: ' + clip(out.searchQuery, 70),
    ];
  }

  if (clearlyNeedsLab && !out.lab) {
    out.lab = true;
    out.labGoal = (out.labGoal || userText || '').slice(0, 200);
    out.labThoughts = ['Deep analysis', 'Goal: ' + clip(out.labGoal || userText, 70)];
  }

  if (!out.writerThoughts || !out.writerThoughts.length) {
    out.writerThoughts = [
      'Review Scout + Lab',
      'Fix weak claims',
      'Write final answer',
    ];
  }
  return out;
}

async function planAgents(opts) {
  const userText = opts.userText;
  const mode = opts.mode;
  const hasFile = opts.hasFile;
  const fileName = opts.fileName;

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
          maxOutputTokens: 400,
          responseMimeType: 'application/json',
        },
      });

      const prompt =
        'Route tools for SetrxAI. Be GENEROUS enabling scout/lab.\n' +
        'Mode=' +
        mode +
        ' hasFile=' +
        !!hasFile +
        ' file=' +
        (fileName || 'none') +
        '\n' +
        'scout=true: GitHub, search, news, medical facts, SetrxAI, prices, docs, dhundo.\n' +
        'lab=true: ilaj/cure framing, code, deep research, design, hard problems.\n' +
        'Both false ONLY for hi/thanks.\n' +
        'JSON: {"scout":bool,"lab":bool,"searchQuery":"str","labGoal":"str",' +
        '"scoutThoughts":["short"],"labThoughts":["short"],"writerThoughts":["short"]}\n' +
        'User: ' +
        (userText || '');

      const r = await withTimeout(model.generateContent(prompt), 12000, 'planAgents');
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
      console.error('planAgents:', e.message);
      plan = empty;
    }
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
  if (/\b(cancer|ilaj)\b/.test(lower) && q.length < 40) {
    q = 'cancer treatment options current medical research overview';
  }

  if (!q) {
    if (onProgress) onProgress({ detail: 'Idle', line: 'No query' });
    return { sources: [], context: '', checks: [] };
  }

  if (onProgress) {
    onProgress({ detail: 'Searching the web', line: 'Query → ' + clip(q, 90) });
  }

  try {
    const data = await withTimeout(searchWeb(q), 18000, 'tavily');
    if (!data || !data.context) {
      if (onProgress) onProgress({ detail: 'No results', line: 'Empty: ' + clip(q, 50) });
      return { sources: [], context: '', checks: [{ note: 'No results' }] };
    }
    if (onProgress) {
      onProgress({
        detail: 'Found ' + (data.sources || []).length + ' sources',
        line:
          (data.sources || [])
            .slice(0, 3)
            .map((s) => s.title)
            .join(' · ') || 'context',
      });
      (data.sources || []).slice(0, 4).forEach((s, i) => {
        onProgress({
          detail: 'Reading source ' + (i + 1),
          line: clip(s.title, 50) + ' | ' + clip(s.url, 48),
        });
      });
    }
    return {
      sources: data.sources || [],
      context: data.context || '',
      checks: [{ note: 'Live web: ' + clip(q, 50) }],
    };
  } catch (e) {
    if (onProgress) onProgress({ detail: 'Search failed', line: e.message || 'error' });
    return { sources: [], context: '', checks: [{ note: 'Search error' }] };
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
    generationConfig: { temperature: 0.35, maxOutputTokens: 900 },
  });

  const ctx = scoutContext ? String(scoutContext).slice(0, 2800) : '';
  const goal = labGoal || userText;

  if (onProgress) {
    onProgress({ detail: 'Lab running', line: 'Topic: ' + clip(goal, 70) });
    onProgress({ detail: 'Reasoning', line: 'Known facts + web + honest limits' });
  }

  try {
    const res = await withTimeout(
      model.generateContent(
        'You are Lab for SetrxAI. Mode=' +
          mode +
          '.\n' +
          'Write NOTES for Writer (not the final user-facing answer).\n' +
          'Sections:\n' +
          '1) Known (established)\n' +
          '2) Web-supported (if any)\n' +
          '3) Plausible / research directions\n' +
          '4) Limits — no fake cures, no invented file trees/code/stats\n' +
          'If weak: mark INSUFFICIENT.\n\n' +
          'Goal: ' +
          goal +
          '\nUser: ' +
          userText +
          '\n' +
          (ctx ? 'Web:\n' + ctx : 'Web: none')
      ),
      22000,
      'lab'
    );
    const notes = (res.response.text() || '').trim();
    if (onProgress) {
      onProgress({
        detail: 'Lab done',
        line: 'Notes (' + notes.length + ' chars) → Writer review',
      });
    }
    return { notes: notes };
  } catch (e) {
    console.error('runLab:', e.message);
    if (onProgress) onProgress({ detail: 'Lab timeout/error', line: e.message || 'failed' });
    return {
      notes: 'Lab incomplete. Writer must answer carefully and state uncertainty.',
    };
  }
}

async function runWriterCheck(opts) {
  const userText = opts.userText;
  const mode = opts.mode;
  const scoutContext = opts.scoutContext || '';
  const labNotes = opts.labNotes || '';
  const sources = opts.sources || [];
  const onProgress = opts.onProgress;

  if (onProgress) {
    onProgress({
      detail: 'Reviewing Scout',
      line: sources.length ? sources.length + ' sources' : 'No web sources',
    });
    onProgress({
      detail: 'Reviewing Lab',
      line: labNotes ? clip(labNotes, 80) : 'No lab notes',
    });
  }

  const key = getGeminiKey();
  if (!key) {
    if (onProgress) onProgress({ detail: 'Review skipped', line: 'No API key — direct write' });
    return { brief: '' };
  }

  if (!scoutContext && !labNotes) {
    if (onProgress) onProgress({ detail: 'Review', line: 'Nothing to merge — direct answer' });
    return { brief: '' };
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
    });

    if (onProgress) {
      onProgress({
        detail: 'Cross-checking',
        line: 'Drop invented structure/code/stats; keep solid facts',
      });
    }

    const res = await withTimeout(
      model.generateContent(
        'You are Writer-Editor for SetrxAI. Mode=' +
          mode +
          '.\n' +
          'User asked: ' +
          userText +
          '\n\n' +
          'Scout web (may be partial):\n' +
          (scoutContext || '(none)').slice(0, 2500) +
          '\n\n' +
          'Lab notes:\n' +
          (labNotes || '(none)').slice(0, 2500) +
          '\n\n' +
          'Write a short EDITOR BRIEF for the final answer (bullets):\n' +
          '- Must keep (solid facts only)\n' +
          '- Must drop: invented file trees, fake code, fake stats, fake sources\n' +
          '- Must state limits / missing context\n' +
          '- Suggested structure of final reply\n' +
          'No final essay — only the brief. Zero fabrication.'
      ),
      14000,
      'writerCheck'
    );
    const brief = (res.response.text() || '').trim();
    if (onProgress) {
      onProgress({
        detail: 'Review done',
        line: 'Brief ready (' + brief.length + ' chars) — writing final',
      });
    }
    return { brief: brief };
  } catch (e) {
    console.error('runWriterCheck:', e.message);
    if (onProgress) onProgress({ detail: 'Review timeout', line: 'Writing without extra brief' });
    return { brief: '' };
  }
}

module.exports = {
  planAgents,
  runScout,
  runLab,
  runWriterCheck,
  withTimeout,
};
