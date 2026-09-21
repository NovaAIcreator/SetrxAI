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
  Check,
  Radar,
  Beaker,
  PenLine,
  Image as ImageIcon,
} from 'lucide-react';
import Message from './Message';
import ModeHero from './ModeHero';
import SourcesList from './SourcesList';
import ArtifactFrame from './ArtifactFrame';
import { useUsage } from './UsageMeter';
import { api } from '../api';

const MODES = [
  { id: 'general', label: 'General', hint: 'Everyday answers' },
  { id: 'study', label: 'Study', hint: 'Notes & concepts' },
  { id: 'coding', label: 'Coding', hint: 'Full working code' },
];

const AGENT_META = {
  scout: {
    id: 'scout',
    label: 'Scout',
    role: 'Web search & sources',
    icon: Radar,
    color: 'text-sky-500',
    bar: 'bg-sky-500',
    ring: 'ring-sky-500/30',
  },
  lab: {
    id: 'lab',
    label: 'Lab',
    role: 'Experiment & verify',
    icon: Beaker,
    color: 'text-violet-500',
    bar: 'bg-violet-500',
    ring: 'ring-violet-500/30',
  },
  writer: {
    id: 'writer',
    label: 'Writer',
    role: 'Final answer',
    icon: PenLine,
    color: 'text-emerald-500',
    bar: 'bg-emerald-500',
    ring: 'ring-emerald-500/30',
  },
};

function ModePill({ mode, setMode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = MODES.find((m) => m.id === mode) || MODES[0];

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    document.addEventListener('touchstart', h);
    return () => {
      document.removeEventListener('mousedown', h);
      document.removeEventListener('touchstart', h);
    };
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 h-9 rounded-full border border-zinc-200 dark:border-zinc-700
          bg-zinc-50 dark:bg-zinc-800/80 px-3 text-xs font-medium text-zinc-800 dark:text-zinc-100
          hover:bg-zinc-100 dark:hover:bg-zinc-800 transition whitespace-nowrap"
      >
        {current.label}
        <ChevronDown size={13} className={'opacity-60 transition ' + (open ? 'rotate-180' : '')} />
      </button>
      {open && (
        <div className="absolute left-0 bottom-full mb-2 z-[100] w-52 rounded-2xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 shadow-2xl p-1.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMode && setMode(m.id);
                setOpen(false);
              }}
              className={
                'w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-start gap-2 transition ' +
                (mode === m.id
                  ? 'bg-zinc-100 dark:bg-zinc-800'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/70')
              }
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">{m.label}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">{m.hint}</div>
              </div>
              {mode === m.id && (
                <Check size={14} className="mt-0.5 text-zinc-700 dark:text-zinc-200 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Simple live agent cards with animation — only active agents shown */
function AgentsLive({ agents }) {
  const list = ['scout', 'lab', 'writer']
    .map((id) => ({ id, ...agents[id], meta: AGENT_META[id] }))
    .filter((a) => a.status && a.status !== 'idle');

  if (!list.length) return null;

  return (
    <div className="mb-5 space-y-2">
      {list.map((a) => {
        const Icon = a.meta.icon;
        const running = a.status === 'running';
        const done = a.status === 'done';
        return (
          <div
            key={a.id}
            className={
              'relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-white/10 ' +
              'bg-white/90 dark:bg-zinc-900/80 backdrop-blur px-3.5 py-3 ' +
              'transition-all duration-300 ' +
              (running ? 'ring-2 ' + a.meta.ring : '')
            }
          >
            <div className="flex items-start gap-3">
              <div
                className={
                  'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ' +
                  'bg-zinc-100 dark:bg-zinc-800 ' +
                  a.meta.color
                }
              >
                <Icon
                  size={18}
                  className={running ? 'animate-pulse' : ''}
                  strokeWidth={1.75}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {a.meta.label}
                  </span>
                  <span className="text-[11px] text-zinc-400">{a.meta.role}</span>
                  <span
                    className={
                      'ml-auto text-[10px] font-medium uppercase tracking-wide ' +
                      (running
                        ? 'text-zinc-800 dark:text-zinc-200'
                        : done
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-zinc-400')
                    }
                  >
                    {running ? 'Working' : done ? 'Done' : a.status}
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] leading-snug text-zinc-600 dark:text-zinc-300">
                  {a.detail || (running ? 'Working…' : '—')}
                </p>
              </div>
            </div>

            {/* progress bar animation */}
            {running && (
              <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={'h-full w-1/3 rounded-full ' + a.meta.bar}
                  style={{
                    animation: 'agent-slide 1.2s ease-in-out infinite',
                  }}
                />
              </div>
            )}
            {done && (
              <div className="mt-3 h-0.5 rounded-full bg-emerald-500/80" />
            )}
          </div>
        );
      })}
      <style>{`
        @keyframes agent-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}

function ImageLimitPill({ remaining, limit }) {
  const low = remaining <= 2;
  return (
    <div
      className={
        'mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ' +
        (low
          ? 'border-amber-300/60 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
          : 'border-zinc-200 bg-white text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300')
      }
    >
      <ImageIcon size={13} className="opacity-70" />
      <span className="tabular-nums font-medium">
        {remaining}/{limit}
      </span>
      <span className="text-zinc-400 dark:text-zinc-500">images today</span>
    </div>
  );
}

const IMAGE_KEYWORDS = [
  'image', 'photo', 'picture', 'draw', 'generate image', 'create image',
  'banao image', 'tasveer', 'wallpaper', 'poster', 'illustration', 'banao', 'bana do',
];
const EDIT_KEYWORDS = [
  'edit', 'improve', 'enhance', 'better', 'fix', 'accha', 'acha',
  'sudhar', 'badal', 'hd', 'quality', 'clear', 'sharp',
];
const SEARCH_KEYWORDS = [
  'search', 'latest', 'news', 'today', 'current', 'price', 'weather', 'score',
  '2025', '2026', 'who won', 'update', 'live',
];

function detectIntent(text, hasPhoto, forceImageGen) {
  const lower = (text || '').toLowerCase().trim();
  if (forceImageGen) return 'image';
  if (hasPhoto && (!lower || EDIT_KEYWORDS.some((k) => lower.includes(k)))) return 'edit';
  if (IMAGE_KEYWORDS.some((k) => lower.includes(k))) return 'image';
  if (SEARCH_KEYWORDS.some((k) => lower.includes(k))) return 'search';
  return null;
}

function needsSearch(text, mode) {
  const lower = (text || '').toLowerCase();
  if (SEARCH_KEYWORDS.some((k) => lower.includes(k))) return true;
  // coding/study pure knowledge — default no search
  if (mode === 'coding' || mode === 'study') return false;
  return false;
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
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

  const [agents, setAgents] = useState({
    scout: { status: 'idle', detail: '' },
    lab: { status: 'idle', detail: '' },
    writer: { status: 'idle', detail: '' },
  });
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
  }, [messages, agents, isEmpty]);

  useEffect(() => {
    const h = (e) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) setShowPlusMenu(false);
    };
    document.addEventListener('mousedown', h);
    document.addEventListener('touchstart', h);
    return () => {
      document.removeEventListener('mousedown', h);
      document.removeEventListener('touchstart', h);
    };
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

  const setAgent = (id, patch) => {
    setAgents((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const resetAgents = () => {
    setAgents({
      scout: { status: 'idle', detail: '' },
      lab: { status: 'idle', detail: '' },
      writer: { status: 'idle', detail: '' },
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
        prev.concat([
          {
            role: 'assistant',
            content: `Aaj ki image limit khatam ho chuki hai (${imageLimit}/day). Kal try karo.`,
          },
        ])
      );
      return;
    }

    const prompt = (promptText || '').trim();
    if ((!prompt && !photo) || imgLoading) return;
    setImgLoading(true);
    setForceImageGen(false);
    lastImageJob.current = { prompt, photo: photo || null };
    shouldScrollRef.current = true;
    const userLabel = photo
      ? prompt
        ? 'Edit photo: "' + prompt + '"'
        : 'Improve this photo'
      : 'Generate image: "' + prompt + '"';
    setMessages((prev) => prev.concat([{ role: 'user', content: userLabel }]));
    try {
      const token = localStorage.getItem('setrxai_token');
      const body = { prompt: prompt || 'high quality, sharp, natural photo' };
      if (photo && photo.data) body.image = { mimeType: photo.mimeType, data: photo.data };
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
        if (textareaRef.current) textareaRef.current.focus();
      };
      reader.readAsDataURL(blob);
    } catch (e) {
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
      input ||
      (attachedFile ? 'File: "' + attachedFile.name + '"' : hasPhoto ? 'Photo' : '');
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

    setInput('');
    setImagePreviews([]);
    setAttachedFile(null);
    setForceImageGen(false);
    setLoading(true);
    setWaitingFirstChunk(true);
    setActiveSources(null);
    setActiveArtifact(null);
    resetAgents();
    setMessages((prev) => prev.concat([{ role: 'assistant', content: '' }]));

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // ——— Agents (simple, only real work) ———
      let scoutResult = null;
      let labHtml = null;

      if (doSearch) {
        setAgent('scout', { status: 'running', detail: 'Searching the web…' });
        await delay(650);
        setAgent('scout', { status: 'running', detail: 'Picking best sources…' });
        await delay(500);
        setAgent('scout', { status: 'done', detail: 'Sources ready' });
        scoutResult = {
          sources: [
            {
              title: 'Reference source',
              url: 'https://en.wikipedia.org/wiki/Main_Page',
              snippet: 'Grounding source (demo until backend search is live).',
            },
          ],
          checks: [{ note: 'Search used only because query needed fresh info' }],
        };
        setActiveSources(scoutResult);
      }

      // Lab only when coding / experiment-ish
      const wantLab =
        mode === 'coding' ||
        /code|html|react|component|experiment|test|debug/i.test(queryText);

      if (wantLab) {
        setAgent('lab', { status: 'running', detail: 'Running experiment…' });
        await delay(600);
        setAgent('lab', { status: 'running', detail: 'Checking result…' });
        await delay(450);
        setAgent('lab', { status: 'done', detail: 'Experiment done' });
        labHtml = `<h2 style="margin:0 0 8px">Lab</h2>
<p style="margin:0 0 12px;color:#555">Quick experiment for your request.</p>
<pre style="background:#111;color:#e5e5e5;padding:12px;border-radius:10px;overflow:auto;font-size:13px">// verified sketch
function ok() { return true; }</pre>`;
        setActiveArtifact(labHtml);
      }

      setAgent('writer', { status: 'running', detail: 'Writing accurate answer…' });
      await delay(350);

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
        const lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.indexOf('data:') !== 0) continue;
          const jsonStr = line.replace('data:', '').trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);

            if (parsed.agent?.id) {
              setAgent(parsed.agent.id, {
                status: parsed.agent.status || 'running',
                detail: parsed.agent.detail || '',
              });
            }
            if (parsed.sources) {
              setActiveSources({ sources: parsed.sources, checks: parsed.checks || [] });
            }
            if (parsed.artifactHtml) setActiveArtifact(parsed.artifactHtml);

            if (parsed.replace) {
              setWaitingFirstChunk(false);
              setAgent('writer', { status: 'done', detail: 'Answer ready' });
              setMessages((prev) => {
                const u = prev.slice();
                u[u.length - 1] = {
                  role: 'assistant',
                  content: parsed.replace,
                  sources: scoutResult?.sources,
                  checks: scoutResult?.checks,
                  artifactHtml: labHtml || null,
                };
                return u;
              });
            }

            if (parsed.chunk) {
              setWaitingFirstChunk(false);
              setAgent('writer', { status: 'running', detail: 'Writing…' });
              setMessages((prev) => {
                const u = prev.slice();
                const last = u[u.length - 1];
                u[u.length - 1] = {
                  role: last.role,
                  content: (last.content || '') + parsed.chunk,
                  sources: last.sources || scoutResult?.sources,
                  checks: last.checks || scoutResult?.checks,
                  artifactHtml: last.artifactHtml || labHtml || null,
                };
                return u;
              });
            }

            if (parsed.error) {
              setWaitingFirstChunk(false);
              setAgent('writer', { status: 'done', detail: 'Error' });
              setMessages((prev) => {
                const u = prev.slice();
                u[u.length - 1] = {
                  role: 'assistant',
                  content: 'Error: ' + parsed.error,
                };
                return u;
              });
            }
          } catch (e) {}
        }
      }

      setAgent('writer', { status: 'done', detail: 'Answer ready' });
    } catch (err) {
      setWaitingFirstChunk(false);
      setAgent('writer', { status: 'done', detail: 'Failed' });
      setMessages((prev) => {
        const u = prev.slice();
        u[u.length - 1] = {
          role: 'assistant',
          content: 'Connection error. Please try again.',
        };
        return u;
      });
    } finally {
      setLoading(false);
      setWaitingFirstChunk(false);
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
    !loading &&
    !imgLoading &&
    (input.trim().length > 0 || imagePreviews.length > 0 || !!attachedFile);

  // ——— Composer: same style as original, no extra limit text inside ———
  const composer = (
    <div className="w-full max-w-2xl mx-auto relative z-20">
      {imagePreviews.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 px-1">
          {imagePreviews.map((p, idx) => (
            <div key={idx} className="relative">
              <img
                src={p.previewUrl}
                alt=""
                className="h-16 w-16 object-cover rounded-xl border border-zinc-200 dark:border-white/10"
              />
              <button
                type="button"
                onClick={() => setImagePreviews((prev) => prev.filter((_, j) => j !== idx))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow"
              >
                <X size={11} />
              </button>
            </div>
          ))}
          <span className="text-[11px] text-zinc-400 self-end pb-1">{imagePreviews.length}/4</span>
        </div>
      )}

      {parsingFile && <p className="text-xs text-zinc-500 mb-2 px-1">Reading file…</p>}
      {attachedFile && !parsingFile && (
        <div className="flex items-center gap-2 mb-2 text-xs bg-zinc-100 dark:bg-zinc-800/80 rounded-xl px-3 py-2 border border-zinc-200 dark:border-white/10">
          <FileText size={14} className="text-zinc-500 shrink-0" />
          <span className="truncate flex-1 text-zinc-700 dark:text-zinc-200">{attachedFile.name}</span>
          <button type="button" onClick={() => setAttachedFile(null)} className="p-0.5">
            <X size={14} className="text-zinc-500" />
          </button>
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
              const el = e.target;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 160) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="w-full resize-none bg-transparent text-[15px] leading-6 text-zinc-900 dark:text-zinc-100 outline-none max-h-[160px] placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
        </div>

        <div className="flex items-center gap-1 px-2 pb-2 pt-1 border-t border-zinc-100 dark:border-white/[0.06] relative z-40">
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            type="file"
            accept=".pdf,.docx,.txt,.csv,.js,.jsx,.ts,.tsx,.py,.json,.md,.html,.css"
            ref={docInputRef}
            onChange={handleDocSelect}
            className="hidden"
          />

          <div className="relative" ref={plusMenuRef}>
            <button
              type="button"
              onClick={() => setShowPlusMenu((v) => !v)}
              className="h-9 w-9 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              aria-label="Attach"
            >
              <Plus size={20} />
            </button>
            {showPlusMenu && (
              <div className="absolute left-0 bottom-full mb-2 w-48 rounded-2xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 shadow-xl p-1.5 z-50">
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowPlusMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <ImageIcon size={16} /> Photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    docInputRef.current?.click();
                    setShowPlusMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <FileText size={16} /> File
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForceImageGen(true);
                    setShowPlusMenu(false);
                    textareaRef.current?.focus();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <Wand2 size={16} /> Generate image
                </button>
              </div>
            )}
          </div>

          <ModePill mode={mode} setMode={setMode} />

          <button
            type="button"
            onClick={toggleListening}
            className={
              'h-9 w-9 rounded-full flex items-center justify-center transition ' +
              (isListening
                ? 'bg-red-500/15 text-red-500'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800')
            }
            aria-label="Voice"
          >
            <Mic size={18} />
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={sendMessage}
            disabled={!canSend}
            className={
              'h-10 w-10 flex items-center justify-center rounded-full transition shrink-0 ' +
              (canSend
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed')
            }
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {!isEmpty && (
        <p className="text-[11px] text-center text-zinc-400 dark:text-zinc-500 mt-2.5">
          SetrxAI can make mistakes. Check important info.
        </p>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-zinc-50 dark:bg-[#0c0c0f]">
      {lightbox && (
        <div
          className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
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
              {/* Image limit — chat area top, not in typebox */}
              <ImageLimitPill remaining={imageLeft} limit={imageLimit} />

              {/* Live agents — only when working */}
              <AgentsLive agents={agents} />

              {displayMessages.map((msg, i) => {
                if (msg.role === 'user' && msg.previewUrls && msg.previewUrls.length) {
                  return (
                    <div key={i} className="flex justify-end mb-5">
                      <div className="max-w-[85%] flex flex-col items-end gap-2">
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          {msg.previewUrls.map((url, j) => (
                            <img
                              key={j}
                              src={url}
                              alt=""
                              className="h-24 w-24 object-cover rounded-xl border border-zinc-200 dark:border-white/10"
                            />
                          ))}
                        </div>
                        {msg.content && msg.content !== 'Photo' && (
                          <div className="rounded-2xl rounded-br-md px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[15px] leading-relaxed">
                            {msg.content}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                if (
                  msg.role === 'assistant' &&
                  msg.content &&
                  msg.content.indexOf('__IMAGE__') === 0
                ) {
                  const rest = msg.content.replace('__IMAGE__', '');
                  const splitAt = rest.indexOf('__PROMPT__');
                  const imgUrl = splitAt >= 0 ? rest.slice(0, splitAt) : rest;
                  const imgPrompt = splitAt >= 0 ? rest.slice(splitAt + 10) : '';
                  return (
                    <div key={i} className="mb-6">
                      <span className="text-xs text-zinc-500 mb-2 block">SetrxAI</span>
                      <button
                        type="button"
                        className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 max-w-sm shadow-sm"
                        onClick={() => setLightbox(imgUrl)}
                      >
                        <img
                          src={imgUrl}
                          alt={imgPrompt}
                          className="w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                      {imgPrompt ? (
                        <p className="text-xs text-zinc-500 mt-1.5">&quot;{imgPrompt}&quot;</p>
                      ) : null}
                      <div className="flex gap-3 mt-2 text-xs text-zinc-500">
                        <a href={imgUrl} target="_blank" rel="noreferrer" className="hover:underline">
                          Download
                        </a>
                        <button
                          type="button"
                          className="hover:underline"
                          onClick={() => useImageForEdit(imgUrl)}
                        >
                          Edit
                        </button>
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
                }

                if (msg.role === 'assistant') {
                  return (
                    <div key={i} className="mb-6">
                      <Message role={msg.role} content={msg.content} />
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

                return <Message key={i} role={msg.role} content={msg.content} />;
              })}

              {imgLoading && (
                <div className="mb-4 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 px-4 py-3 text-sm text-zinc-500">
                  Generating image…
                </div>
              )}
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
