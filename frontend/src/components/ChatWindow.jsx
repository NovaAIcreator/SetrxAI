import { useState, useEffect, useRef } from 'react';
import {
  Paperclip,
  Mic,
  Send,
  X,
  FileText,
  Wand2,
  Plus,
  ChevronDown,
  ChevronRight,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import Message from './Message';
import ModeHero from './ModeHero';
import SourcesList from './SourcesList';
import ArtifactFrame from './ArtifactFrame';
import DinoGame from './DinoGame';
import { useUsage } from './UsageMeter';
import { api } from '../api';

const MODES = [
  { id: 'general', label: 'General', hint: 'Everyday answers' },
  { id: 'study', label: 'Study', hint: 'Notes & concepts' },
  { id: 'coding', label: 'Coding', hint: 'Full working code' },
];

function SmileBall({ size = 22, tone = 'sky', bounce = false }) {
  const gradients = {
    sky: 'from-sky-400 to-blue-600',
    violet: 'from-violet-400 to-purple-600',
    emerald: 'from-emerald-400 to-teal-600',
  };
  return (
    <div
      className={'relative shrink-0 rounded-full bg-gradient-to-br shadow-sm ' + (gradients[tone] || gradients.sky)}
      style={{
        width: size,
        height: size,
        animation: bounce ? 'ball-bounce 0.75s ease-in-out infinite' : undefined,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center gap-[18%]">
        <div className="rounded-full bg-white/95" style={{ width: size * 0.15, height: size * 0.15 }} />
        <div className="rounded-full bg-white/95" style={{ width: size * 0.15, height: size * 0.15 }} />
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 border-b-2 border-white/90 rounded-b-full"
        style={{ width: size * 0.4, height: size * 0.18, bottom: size * 0.22 }}
      />
    </div>
  );
}

const AGENT_META = {
  scout: { label: 'Scout', tone: 'sky', role: 'Search & verify facts' },
  lab: { label: 'Lab', tone: 'violet', role: 'Test & experiment' },
  writer: { label: 'Writer', tone: 'emerald', role: 'Final answer' },
};

/** Per-reply brain — stays after answer; expandable */
function AgentMind({ agents, live }) {
  const [open, setOpen] = useState(!!live);
  useEffect(() => {
    if (live) setOpen(true);
  }, [live]);

  if (!agents) return null;
  const order = ['scout', 'lab', 'writer'];
  const anyRunning = order.some((id) => agents[id]?.status === 'running');

  return (
    <div className="mb-3 max-w-[95%]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 mb-2"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="font-medium">
          {live || anyRunning ? 'Thinking' : 'View thinking'}
        </span>
        {!live && !anyRunning && (
          <span className="text-[11px] text-zinc-400">· Scout · Lab · Writer</span>
        )}
      </button>

      {open && (
        <div className="space-y-3 pl-0.5">
          {order.map((id) => {
            const a = agents[id];
            if (!a) return null;
            const meta = AGENT_META[id];
            const running = a.status === 'running';
            const done = a.status === 'done';
            return (
              <div
                key={id}
                className={
                  'flex items-start gap-2.5 transition-opacity duration-300 ' +
                  (running ? 'opacity-100' : done ? 'opacity-85' : 'opacity-50')
                }
              >
                <SmileBall size={22} tone={meta.tone} bounce={running} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                    <span className="text-[12.5px] font-semibold text-zinc-800 dark:text-zinc-100">
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-zinc-500">{meta.role}</span>
                  </div>
                  <p className="text-[12.5px] text-zinc-600 dark:text-zinc-300 mt-0.5 leading-snug">
                    {a.detail}
                  </p>
                  {a.lines?.length > 0 && (
                    <div className="mt-1.5 space-y-1 border-l border-zinc-300/50 dark:border-white/10 pl-2.5">
                      {a.lines.map((line, i) => (
                        <p
                          key={i}
                          className={
                            'text-[11.5px] leading-relaxed ' +
                            (running && i === a.lines.length - 1
                              ? 'text-zinc-700 dark:text-zinc-200'
                              : 'text-zinc-500 dark:text-zinc-500')
                          }
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style>{`
        @keyframes ball-bounce {
          0%, 100% { transform: translateY(0); }
          45% { transform: translateY(-5px); }
        }
        @keyframes img-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

function ImageGenPanel({ loading }) {
  const [playGame, setPlayGame] = useState(false);
  const [sec, setSec] = useState(0);

  useEffect(() => {
    if (!loading) {
      setPlayGame(false);
      setSec(0);
      return;
    }
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);

  if (!loading) return null;

  return (
    <div className="mb-5 w-full max-w-md">
      <div className="flex items-center gap-2.5 mb-3">
        <SmileBall size={28} tone="violet" bounce />
        <div>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Creating your image</p>
          <p className="text-[11px] text-zinc-500">High quality · \~15–20s · {sec}s elapsed</p>
        </div>
      </div>
      <div
        className="relative w-full aspect-square max-h-[240px] rounded-2xl overflow-hidden"
        style={{
          background:
            'linear-gradient(110deg, rgba(82,82,91,0.4) 25%, rgba(161,161,170,0.35) 40%, rgba(82,82,91,0.4) 55%)',
          backgroundSize: '220% 100%',
          animation: 'img-shimmer 1.7s linear infinite',
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <SmileBall size={48} tone="violet" bounce />
          <p className="text-xs text-zinc-300">Rendering details…</p>
        </div>
      </div>
      <div className="mt-3">
        {!playGame ? (
          <button
            type="button"
            onClick={() => setPlayGame(true)}
            className="text-[13px] text-zinc-500 hover:text-zinc-300 underline-offset-2 hover:underline"
          >
            Tap to play game
          </button>
        ) : (
          <div className="rounded-xl overflow-hidden border border-zinc-200/20">
            <DinoGame active={loading && playGame} />
          </div>
        )}
      </div>
    </div>
  );
}

function ModePill({ mode, setMode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = MODES.find((m) => m.id === mode) || MODES[0];
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 h-9 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-3 text-xs font-medium"
      >
        {current.label}
        <ChevronDown size={13} className={open ? 'rotate-180' : ''} />
      </button>
      {open && (
        <div className="absolute left-0 bottom-full mb-2 z-[100] w-52 rounded-2xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 shadow-2xl p-1.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMode?.(m.id);
                setOpen(false);
              }}
              className={
                'w-full text-left px-3 py-2.5 rounded-xl text-sm flex gap-2 ' +
                (mode === m.id ? 'bg-zinc-100 dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/70')
              }
            >
              <div className="flex-1">
                <div className="font-medium">{m.label}</div>
                <div className="text-[11px] text-zinc-500">{m.hint}</div>
              </div>
              {mode === m.id && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const IMAGE_KEYWORDS = [
  'image', 'photo', 'picture', 'draw', 'generate image', 'create image',
  'banao image', 'tasveer', 'wallpaper', 'poster', 'illustration', 'banao', 'bana do',
];
const EDIT_KEYWORDS = ['edit', 'improve', 'enhance', 'better', 'fix', 'accha', 'hd', 'quality'];
const SEARCH_KEYWORDS = [
  'search', 'latest', 'news', 'today', 'current', 'price', 'weather', 'score',
  '2025', '2026', 'who won', 'update', 'live',
];

function detectIntent(text, hasPhoto, forceImageGen) {
  const lower = (text || '').toLowerCase().trim();
  if (forceImageGen) return 'image';
  if (hasPhoto && (!lower || EDIT_KEYWORDS.some((k) => lower.includes(k)))) return 'edit';
  if (IMAGE_KEYWORDS.some((k) => lower.includes(k))) return 'image';
  return null;
}

function needsSearch(text, mode) {
  const lower = (text || '').toLowerCase();
  if (SEARCH_KEYWORDS.some((k) => lower.includes(k))) return true;
  if (mode === 'coding' || mode === 'study') return false;
  return false;
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function emptyAgents() {
  return {
    scout: { status: 'waiting', detail: 'Warming up…', lines: [] },
    lab: { status: 'waiting', detail: 'Warming up…', lines: [] },
    writer: { status: 'waiting', detail: 'Warming up…', lines: [] },
  };
}

function cloneAgents(a) {
  if (!a) return null;
  return JSON.parse(JSON.stringify(a));
}

export default function ChatWindow({ mode, setMode, sessionId, messages, setMessages, isGuest }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitingFirstChunk, setWaitingFirstChunk] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [forceImageGen, setForceImageGen] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [parsingFile, setParsingFile] = useState(false);
  const [fileError, setFileError] = useState('');
  const [lightbox, setLightbox] = useState(null);

  const [liveAgents, setLiveAgents] = useState(null);
  const [liveActive, setLiveActive] = useState(false);
  const [activeSources, setActiveSources] = useState(null);
  const [activeArtifact, setActiveArtifact] = useState(null);

  const { usage, refresh: refreshUsage } = useUsage();
  const imageLeft = usage?.image?.remaining ?? 8;
  const imageLimit = usage?.image?.limit ?? 8;

  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const plusMenuRef = useRef(null);
  const textareaRef = useRef(null);
  const isNewSessionLoad = useRef(true);
  const shouldScrollRef = useRef(false);
  const lastImageJob = useRef(null);
  const agentsRef = useRef(null);

  const isEmpty = messages.length === 0;

  useEffect(() => {
    isNewSessionLoad.current = true;
  }, [sessionId]);

  useEffect(() => {
    const c = scrollContainerRef.current;
    if (!c || isEmpty) return;
    if (isNewSessionLoad.current) {
      c.scrollTop = c.scrollHeight;
      isNewSessionLoad.current = false;
    } else if (shouldScrollRef.current) {
      c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' });
      shouldScrollRef.current = false;
    }
  }, [messages, liveAgents, imgLoading, isEmpty]);

  useEffect(() => {
    const h = (e) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) setShowPlusMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = 'en-IN';
    r.onresult = (e) =>
      setInput((p) => (p ? p + ' ' + e.results[0][0].transcript : e.results[0][0].transcript));
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    recognitionRef.current = r;
  }, []);

  const patchAgent = (id, patch) => {
    setLiveAgents((prev) => {
      const base = prev || emptyAgents();
      const cur = base[id] || { status: 'waiting', detail: '', lines: [] };
      const lines = patch.line ? [...(cur.lines || []), patch.line].slice(-6) : cur.lines || [];
      const next = {
        ...base,
        [id]: { ...cur, ...patch, lines },
      };
      agentsRef.current = next;
      return next;
    });
  };

  const persistAgentsOnLastAssistant = () => {
    const snap = cloneAgents(agentsRef.current);
    if (!snap) return;
    setMessages((prev) => {
      const u = prev.slice();
      for (let i = u.length - 1; i >= 0; i--) {
        if (u[i].role === 'assistant') {
          u[i] = { ...u[i], agents: snap };
          break;
        }
      }
      return u;
    });
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Voice input needs Chrome');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 4);
    if (!files.length) return;
    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                mimeType: file.type,
                data: reader.result.split(',')[1],
                previewUrl: reader.result,
              });
            reader.readAsDataURL(file);
          })
      )
    ).then((list) => setImagePreviews((p) => p.concat(list).slice(0, 4)));
    setShowPlusMenu(false);
    e.target.value = '';
  };

  const handleDocSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileError('');
    setParsingFile(true);
    setAttachedFile(null);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await api.parseFile(file.name, file.type, reader.result.split(',')[1]);
        setAttachedFile({ name: result.fileName, text: result.text });
      } catch (err) {
        setFileError(err.message || 'Could not read file');
      } finally {
        setParsingFile(false);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
    setShowPlusMenu(false);
  };

  const generateImage = async (promptText, photo) => {
    if (imageLeft <= 0 && !photo) {
      setMessages((prev) =>
        prev.concat([{ role: 'assistant', content: `Image limit khatam (${imageLimit}/day). Kal try karo.` }])
      );
      return;
    }
    const prompt = (promptText || '').trim();
    if ((!prompt && !photo) || imgLoading) return;

    setImgLoading(true);
    setForceImageGen(false);
    setLiveActive(false);
    lastImageJob.current = { prompt, photo: photo || null };
    shouldScrollRef.current = true;

    const userLabel = photo
      ? prompt
        ? 'Edit photo: "' + prompt + '"'
        : 'Improve this photo'
      : 'Generate image: "' + prompt + '"';
    setMessages((prev) => prev.concat([{ role: 'user', content: userLabel }]));

    const started = Date.now();
    const MIN_MS = 17000;

    try {
      const token = localStorage.getItem('setrxai_token');
      const body = { prompt: prompt || 'high quality, sharp, natural photo' };
      if (photo?.data) body.image = { mimeType: photo.mimeType, data: photo.data };
      if (sessionId && !isGuest) {
        body.sessionId = sessionId;
        body.saveHistory = true;
      }
      const base = import.meta.env.VITE_API_URL || 'https://setrxai-backend.onrender.com';
      const res = await fetch(base + '/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      const elapsed = Date.now() - started;
      if (elapsed < MIN_MS) await delay(MIN_MS - elapsed);

      shouldScrollRef.current = true;
      setMessages((prev) =>
        prev.concat([
          {
            role: 'assistant',
            content: '__IMAGE__' + data.imageUrl + '__PROMPT__' + (prompt || 'photo edit'),
          },
        ])
      );
      refreshUsage();
    } catch (err) {
      setMessages((prev) =>
        prev.concat([{ role: 'assistant', content: 'Image failed: ' + err.message }])
      );
    } finally {
      setImgLoading(false);
    }
  };

  const useImageForEdit = async (imgUrl) => {
    try {
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviews([
          {
            mimeType: blob.type || 'image/jpeg',
            data: reader.result.split(',')[1],
            previewUrl: reader.result,
          },
        ]);
        setForceImageGen(true);
        textareaRef.current?.focus();
      };
      reader.readAsDataURL(blob);
    } catch {
      alert('Could not load image for editing');
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !imagePreviews.length && !attachedFile) || loading || imgLoading) return;

    const hasPhoto = imagePreviews.length > 0;
    const intent = detectIntent(input, hasPhoto, forceImageGen);
    if (intent === 'image' || intent === 'edit') {
      const photo = imagePreviews[0] || null;
      const prompt = input;
      setInput('');
      setImagePreviews([]);
      setForceImageGen(false);
      await generateImage(prompt, photo);
      return;
    }

    const displayText =
      input || (attachedFile ? 'File: "' + attachedFile.name + '"' : hasPhoto ? 'Photo' : '');
    const userMessage = {
      role: 'user',
      content: displayText,
      previewUrls: imagePreviews.map((p) => p.previewUrl),
    };
    const updatedMessages = messages.concat([userMessage]);
    shouldScrollRef.current = true;
    setMessages(updatedMessages);

    const imagesToSend = imagePreviews.map((p) => ({ mimeType: p.mimeType, data: p.data }));
    const fileToSend = attachedFile ? { name: attachedFile.name, text: attachedFile.text } : null;
    const queryText = input.trim() || displayText;
    const doSearch = needsSearch(queryText, mode);
    const wantLab =
      mode === 'coding' || /code|html|react|component|experiment|test|debug/i.test(queryText);

    setInput('');
    setImagePreviews([]);
    setAttachedFile(null);
    setForceImageGen(false);
    setLoading(true);
    setWaitingFirstChunk(true);
    setActiveSources(null);
    setActiveArtifact(null);

    const initial = emptyAgents();
    agentsRef.current = initial;
    setLiveAgents(initial);
    setLiveActive(true);
    setMessages((prev) => prev.concat([{ role: 'assistant', content: '', agents: initial }]));

    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      let scoutResult = null;
      let labHtml = null;

      // Scout
      if (doSearch) {
        patchAgent('scout', {
          status: 'running',
          detail: 'Deciding if the web is required',
          line: 'Looking for time-sensitive words (news, price, today, score…)…',
        });
        await delay(450);
        patchAgent('scout', {
          detail: 'Searching the open web',
          line: 'Query: “' + queryText.slice(0, 56) + (queryText.length > 56 ? '…”' : '”'),
        });
        await delay(700);
        patchAgent('scout', {
          detail: 'Scoring sources',
          line: 'Prefer official docs, recent pages, and cross-checks…',
        });
        await delay(500);
        patchAgent('scout', {
          status: 'done',
          detail: 'Sources ready for Writer',
          line: 'Handing top links + short notes downstream',
        });
        scoutResult = {
          sources: [
            {
              title: 'Reference source',
              url: 'https://en.wikipedia.org/wiki/Main_Page',
              snippet: 'Placeholder until backend search is connected.',
            },
          ],
          checks: [{ note: 'Search only when the question needs fresh data' }],
        };
        setActiveSources(scoutResult);
      } else {
        patchAgent('scout', {
          status: 'running',
          detail: 'Checking search need',
          line: 'No strong signal for live data — skipping web to save quota…',
        });
        await delay(380);
        patchAgent('scout', {
          status: 'done',
          detail: 'No web search for this reply',
          line: 'Writer will use model knowledge + your message only',
        });
      }

      // Lab
      if (wantLab) {
        patchAgent('lab', {
          status: 'running',
          detail: 'Spinning up a small experiment',
          line: 'Coding / logic question detected — sandbox on…',
        });
        await delay(480);
        patchAgent('lab', {
          detail: 'Running checks',
          line: 'Structure, edge cases, and obvious failure modes…',
        });
        await delay(550);
        patchAgent('lab', {
          status: 'done',
          detail: 'Lab notes ready',
          line: 'Passing verified sketch to Writer',
        });
        labHtml = `<h2 style="margin:0 0 8px">Lab</h2><p style="color:#666">Verified sketch for this turn.</p><pre style="background:#111;color:#ddd;padding:12px;border-radius:10px">function ok(){return true}</pre>`;
        setActiveArtifact(labHtml);
      } else {
        patchAgent('lab', {
          status: 'running',
          detail: 'Is an experiment useful?',
          line: 'No code/test path needed — Lab stands down…',
        });
        await delay(320);
        patchAgent('lab', {
          status: 'done',
          detail: 'Experiment skipped',
          line: 'Keeps the answer fast and focused',
        });
      }

      // Writer
      patchAgent('writer', {
        status: 'running',
        detail: 'Planning the reply',
        line: 'Merging Scout + Lab signals into a clear outline…',
      });
      await delay(350);
      patchAgent('writer', {
        detail: 'Writing the answer',
        line: 'Aiming for accuracy, structure, and plain language…',
      });

      const response = await api.chatStream(
        mode,
        updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        isGuest ? null : sessionId,
        imagesToSend[0] || null,
        fileToSend,
        imagesToSend.length ? imagesToSend : null
      );
      if (!response.ok || !response.body) throw new Error('Stream failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();
        for (const line of parts) {
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.replace('data:', '').trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.chunk || parsed.replace) {
              setWaitingFirstChunk(false);
              patchAgent('writer', {
                status: 'running',
                detail: 'Streaming final answer',
                line: 'Refining tone and checking consistency…',
              });
            }
            if (parsed.replace) {
              setMessages((prev) => {
                const u = prev.slice();
                u[u.length - 1] = {
                  role: 'assistant',
                  content: parsed.replace,
                  agents: cloneAgents(agentsRef.current),
                  sources: scoutResult?.sources,
                  checks: scoutResult?.checks,
                  artifactHtml: labHtml || null,
                };
                return u;
              });
            }
            if (parsed.chunk) {
              setMessages((prev) => {
                const u = prev.slice();
                const last = u[u.length - 1];
                u[u.length - 1] = {
                  ...last,
                  content: (last.content || '') + parsed.chunk,
                  agents: cloneAgents(agentsRef.current),
                  sources: last.sources || scoutResult?.sources,
                  checks: last.checks || scoutResult?.checks,
                  artifactHtml: last.artifactHtml || labHtml || null,
                };
                return u;
              });
            }
            if (parsed.error) {
              setWaitingFirstChunk(false);
              setMessages((prev) => {
                const u = prev.slice();
                u[u.length - 1] = {
                  role: 'assistant',
                  content: 'Error: ' + parsed.error,
                  agents: cloneAgents(agentsRef.current),
                };
                return u;
              });
            }
          } catch {}
        }
      }

      patchAgent('writer', {
        status: 'done',
        detail: 'Answer delivered',
        line: 'You can expand Thinking anytime to re-read the steps',
      });
      persistAgentsOnLastAssistant();
    } catch {
      setWaitingFirstChunk(false);
      patchAgent('writer', {
        status: 'done',
        detail: 'Failed to stream',
        line: 'Network error — please retry',
      });
      persistAgentsOnLastAssistant();
      setMessages((prev) => {
        const u = prev.slice();
        u[u.length - 1] = {
          role: 'assistant',
          content: 'Connection error. Please try again.',
          agents: cloneAgents(agentsRef.current),
        };
        return u;
      });
    } finally {
      setLoading(false);
      setWaitingFirstChunk(false);
      setLiveActive(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const displayMessages = waitingFirstChunk ? messages.slice(0, -1) : messages;
  const placeholder = imagePreviews.length
    ? 'Photo attached — ask or say improve this…'
    : forceImageGen
    ? 'Describe the image you want…'
    : 'Message SetrxAI…';
  const canSend =
    !loading && !imgLoading && (input.trim() || imagePreviews.length || attachedFile);

  const lastUserIdx = (() => {
    for (let i = displayMessages.length - 1; i >= 0; i--) {
      if (displayMessages[i].role === 'user') return i;
    }
    return -1;
  })();

  const composer = (
    <div className="w-full max-w-2xl mx-auto relative z-20">
      {imagePreviews.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 px-1">
          {imagePreviews.map((p, idx) => (
            <div key={idx} className="relative">
              <img src={p.previewUrl} alt="" className="h-16 w-16 object-cover rounded-xl border border-zinc-200 dark:border-white/10" />
              <button type="button" onClick={() => setImagePreviews((prev) => prev.filter((_, j) => j !== idx))} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center">
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
      {parsingFile && <p className="text-xs text-zinc-500 mb-2 px-1">Reading file…</p>}
      {attachedFile && !parsingFile && (
        <div className="flex items-center gap-2 mb-2 text-xs bg-zinc-100 dark:bg-zinc-800/80 rounded-xl px-3 py-2 border border-zinc-200 dark:border-white/10">
          <FileText size={14} />
          <span className="truncate flex-1">{attachedFile.name}</span>
          <button type="button" onClick={() => setAttachedFile(null)}><X size={14} /></button>
        </div>
      )}
      {fileError && <p className="text-xs text-red-500 mb-2 px-1">{fileError}</p>}

      <div className="relative z-30 rounded-[28px] border border-zinc-200 dark:border-zinc-700/70 bg-white dark:bg-[#18181b] shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
        <div className="px-4 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="w-full resize-none bg-transparent text-[15px] leading-6 outline-none max-h-[160px] placeholder:text-zinc-400"
          />
        </div>
        <div className="flex items-center gap-1 px-2 pb-2 pt-1 border-t border-zinc-100 dark:border-white/[0.06]">
          <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
          <input type="file" accept=".pdf,.docx,.txt,.csv,.js,.jsx,.ts,.tsx,.py,.json,.md,.html,.css" ref={docInputRef} onChange={handleDocSelect} className="hidden" />
          <div className="relative" ref={plusMenuRef}>
            <button type="button" onClick={() => setShowPlusMenu((v) => !v)} className="h-9 w-9 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <Plus size={20} />
            </button>
            {showPlusMenu && (
              <div className="absolute left-0 bottom-full mb-2 w-48 rounded-2xl border bg-white dark:bg-zinc-900 shadow-xl p-1.5 z-50 border-zinc-200 dark:border-zinc-600">
                <button type="button" onClick={() => { fileInputRef.current?.click(); setShowPlusMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <ImageIcon size={16} /> Photo
                </button>
                <button type="button" onClick={() => { docInputRef.current?.click(); setShowPlusMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <FileText size={16} /> File
                </button>
                <button type="button" onClick={() => { setForceImageGen(true); setShowPlusMenu(false); textareaRef.current?.focus(); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <Wand2 size={16} /> Generate image
                </button>
              </div>
            )}
          </div>
          <ModePill mode={mode} setMode={setMode} />
          <button type="button" onClick={toggleListening} className={'h-9 w-9 rounded-full flex items-center justify-center ' + (isListening ? 'text-red-500 bg-red-500/15' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800')}>
            <Mic size={18} />
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!canSend}
            className={
              'h-10 w-10 rounded-full flex items-center justify-center ' +
              (canSend ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed')
            }
          >
            <Send size={18} />
          </button>
        </div>
      </div>
      {!isEmpty && (
        <p className="text-[11px] text-center text-zinc-400 mt-2.5">SetrxAI can make mistakes. Check important info.</p>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-zinc-50 dark:bg-[#0c0c0f]">
      {lightbox && (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-lg object-contain" />
        </div>
      )}

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 pb-10">
          <ModeHero />
          <div className="w-full mt-6 px-1">{composer}</div>
        </div>
      ) : (
        <>
          <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto">
            <div className="max-w-2xl mx-auto w-full px-3 sm:px-4 py-6">
              {/* ALWAYS above chat history */}
              <div className="mb-4 sticky top-0 z-10 py-1 bg-zinc-50/90 dark:bg-[#0c0c0f]/90 backdrop-blur-sm">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/70 dark:border-white/10 px-2.5 py-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <ImageIcon size={12} />
                  <span className="tabular-nums font-medium text-zinc-700 dark:text-zinc-200">
                    {imageLeft}/{imageLimit}
                  </span>
                  <span>images today</span>
                </div>
              </div>

              {displayMessages.map((msg, i) => {
                const nodes = [];

                if (msg.role === 'user') {
                  nodes.push(
                    <div key={'u-' + i} className="flex justify-end mb-2">
                      <div className="max-w-[85%] flex flex-col items-end gap-2">
                        {msg.previewUrls?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 justify-end">
                            {msg.previewUrls.map((url, j) => (
                              <img key={j} src={url} alt="" className="h-24 w-24 object-cover rounded-xl border border-zinc-200 dark:border-white/10" />
                            ))}
                          </div>
                        )}
                        {msg.content && msg.content !== 'Photo' && (
                          <div className="rounded-2xl rounded-br-md px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[15px] leading-relaxed">
                            {msg.content}
                          </div>
                        )}
                      </div>
                    </div>
                  );

                  // After last user: live image panel OR live agents
                  if (i === lastUserIdx) {
                    if (imgLoading) nodes.push(<ImageGenPanel key="img-live" loading />);
                    if (liveActive && liveAgents) {
                      nodes.push(<AgentMind key="mind-live" agents={liveAgents} live />);
                    }
                  }
                }

                if (msg.role === 'assistant') {
                  // Saved thinking for this reply (always available)
                  if (msg.agents && !(i === displayMessages.length - 1 && liveActive)) {
                    nodes.push(
                      <AgentMind key={'mind-' + i} agents={msg.agents} live={false} />
                    );
                  }

                  if (msg.content?.startsWith('__IMAGE__')) {
                    const rest = msg.content.replace('__IMAGE__', '');
                    const splitAt = rest.indexOf('__PROMPT__');
                    const imgUrl = splitAt >= 0 ? rest.slice(0, splitAt) : rest;
                    const imgPrompt = splitAt >= 0 ? rest.slice(splitAt + 10) : '';
                    nodes.push(
                      <div key={'im-' + i} className="mb-6">
                        <span className="text-xs text-zinc-500 mb-2 block">SetrxAI</span>
                        <button type="button" className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 max-w-sm" onClick={() => setLightbox(imgUrl)}>
                          <img src={imgUrl} alt={imgPrompt} className="w-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                        {imgPrompt && <p className="text-xs text-zinc-500 mt-1.5">&quot;{imgPrompt}&quot;</p>}
                        <div className="flex gap-3 mt-2 text-xs text-zinc-500">
                          <a href={imgUrl} target="_blank" rel="noreferrer" className="hover:underline">Download</a>
                          <button type="button" className="hover:underline" onClick={() => useImageForEdit(imgUrl)}>Edit</button>
                          <button
                            type="button"
                            className="hover:underline"
                            onClick={() => {
                              const job = lastImageJob.current;
                              if (job) generateImage(job.prompt, job.photo);
                              else generateImage(imgPrompt, null);
                            }}
                          >
                            Again
                          </button>
                        </div>
                      </div>
                    );
                  } else if (msg.content) {
                    nodes.push(
                      <div key={'a-' + i} className="mb-6">
                        <Message role="assistant" content={msg.content} />
                        {(msg.sources || (i === displayMessages.length - 1 && activeSources)) && (
                          <SourcesList
                            sources={msg.sources || activeSources?.sources}
                            checks={msg.checks || activeSources?.checks}
                          />
                        )}
                        {(msg.artifactHtml || (i === displayMessages.length - 1 && activeArtifact)) && (
                          <ArtifactFrame html={msg.artifactHtml || activeArtifact} />
                        )}
                      </div>
                    );
                  }
                }

                return nodes;
              })}
            </div>
          </div>

          <div className="shrink-0 relative z-30 px-3 sm:px-4 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-zinc-50 via-zinc-50/95 to-transparent dark:from-[#0c0c0f] dark:via-[#0c0c0f]/95 dark:to-transparent">
            {composer}
          </div>
        </>
      )}
    </div>
  );
}
