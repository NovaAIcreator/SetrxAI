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
} from 'lucide-react';
import Message from './Message';
import ModeHero from './ModeHero';
import { api } from '../api';

function ThinkingPanel({ steps }) {
  const [open, setOpen] = useState(true);
  if (!steps || steps.length === 0) return null;
  return (
    <div className="mb-4 px-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="font-medium">Thinking</span>
      </button>
      {open && (
        <div className="mt-1.5 ml-5 space-y-1 border-l border-zinc-200 dark:border-white/10 pl-3">
          {steps.map((s, i) => (
            <p key={i} className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-snug">
              {s}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function ImageGeneratingAnimation() {
  const [step, setStep] = useState(0);
  const steps = [
    'Understanding your request',
    'Composing the image',
    'Adding detail',
    'Almost ready',
  ];
  useEffect(() => {
    const t = setInterval(() => setStep((p) => (p < steps.length - 1 ? p + 1 : p)), 2200);
    return () => clearInterval(t);
  }, []);
  return <ThinkingPanel steps={[steps[step]]} />;
}

const IMAGE_KEYWORDS = [
  'image',
  'photo',
  'picture',
  'draw',
  'generate image',
  'create image',
  'banao image',
  'tasveer',
  'wallpaper',
  'poster',
  'illustration',
  'banao',
  'bana do',
];
const EDIT_KEYWORDS = [
  'edit',
  'improve',
  'enhance',
  'better',
  'fix',
  'accha',
  'acha',
  'sudhar',
  'badal',
  'hd',
  'quality',
  'clear',
  'sharp',
];
const SEARCH_KEYWORDS = [
  'search',
  'latest',
  'news',
  'today',
  'current',
  'price',
  'weather',
  'score',
  '2025',
  '2026',
];

function detectIntent(text, hasPhoto, forceImageGen) {
  const lower = (text || '').toLowerCase().trim();
  if (forceImageGen) return 'image';
  if (hasPhoto && (!lower || EDIT_KEYWORDS.some((k) => lower.includes(k)))) return 'edit';
  if (IMAGE_KEYWORDS.some((k) => lower.includes(k))) return 'image';
  if (SEARCH_KEYWORDS.some((k) => lower.includes(k))) return 'search';
  return null;
}

export default function ChatWindow({ mode, setMode, sessionId, messages, setMessages, isGuest }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitingFirstChunk, setWaitingFirstChunk] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [forceImageGen, setForceImageGen] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [parsingFile, setParsingFile] = useState(false);
  const [fileError, setFileError] = useState('');
  const [lightbox, setLightbox] = useState(null);

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
    if (!c) return;
    if (isNewSessionLoad.current) {
      c.scrollTop = c.scrollHeight;
      isNewSessionLoad.current = false;
    } else if (shouldScrollRef.current) {
      c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' });
      shouldScrollRef.current = false;
    }
  }, [messages, thinkingSteps]);

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

  const pushThinking = (text) => {
    const t = String(text || '')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
      .trim();
    if (!t) return;
    setThinkingSteps((prev) => {
      if (prev[prev.length - 1] === t) return prev;
      return prev.concat([t]).slice(-8);
    });
  };

  const clearThinking = () => setThinkingSteps([]);

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

    setInput('');
    setImagePreviews([]);
    setAttachedFile(null);
    setForceImageGen(false);
    setLoading(true);
    setWaitingFirstChunk(true);
    setThinkingSteps(['Thinking']);
    if (intent === 'search') setIsSearching(true);
    setMessages((prev) => prev.concat([{ role: 'assistant', content: '' }]));

    try {
      const response = await api.chatStream(
        mode,
        updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        isGuest ? null : sessionId,
        imagesToSend[0] || null,
        fileToSend,
        imagesToSend.length ? imagesToSend : null
      );
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

            if (parsed.thinking) {
              pushThinking(parsed.thinking);
              setWaitingFirstChunk(true);
            }

            if (parsed.replace) {
              clearThinking();
              setWaitingFirstChunk(false);
              setMessages((prev) => {
                const u = prev.slice();
                u[u.length - 1] = { role: 'assistant', content: parsed.replace };
                return u;
              });
            }

            if (parsed.chunk) {
              clearThinking();
              setWaitingFirstChunk(false);
              setIsSearching(false);
              setMessages((prev) => {
                const u = prev.slice();
                const last = u[u.length - 1];
                u[u.length - 1] = { role: last.role, content: last.content + parsed.chunk };
                return u;
              });
            }

            if (parsed.error) {
              clearThinking();
              setWaitingFirstChunk(false);
              setIsSearching(false);
              setMessages((prev) => {
                const u = prev.slice();
                u[u.length - 1] = { role: 'assistant', content: 'Error: ' + parsed.error };
                return u;
              });
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      clearThinking();
      setWaitingFirstChunk(false);
      setIsSearching(false);
      setMessages((prev) => {
        const u = prev.slice();
        u[u.length - 1] = { role: 'assistant', content: 'Connection error. Please try again.' };
        return u;
      });
    } finally {
      setLoading(false);
      setWaitingFirstChunk(false);
      setIsSearching(false);
      clearThinking();
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
    ? 'Photo attached — ask a question or say “improve this”…'
    : forceImageGen
    ? 'Describe the image you want…'
    : 'Message SetrxAI…';

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

      <div
        ref={scrollContainerRef}
        className={'flex-1 min-h-0 overflow-y-auto ' + (isEmpty ? 'flex flex-col' : '')}
      >
        <div
          className={
            'max-w-2xl mx-auto w-full px-3 sm:px-4 ' +
            (isEmpty ? 'flex flex-col flex-1 justify-center pb-2' : 'py-6')
          }
        >
          {isEmpty && <ModeHero mode={mode} onSelect={(t) => setInput(t)} />}

          {!isEmpty &&
            displayMessages.map((msg, i) => {
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

              if (msg.role === 'assistant' && msg.content && msg.content.indexOf('__IMAGE__') === 0) {
                const rest = msg.content.replace('__IMAGE__', '');
                const splitAt = rest.indexOf('__PROMPT__');
                const imgUrl = splitAt >= 0 ? rest.slice(0, splitAt) : rest;
                const imgPrompt = splitAt >= 0 ? rest.slice(splitAt + 10) : '';
                return (
                  <div key={i} className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-zinc-500">SetrxAI</span>
                    </div>
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
                      <button type="button" className="hover:underline" onClick={() => useImageForEdit(imgUrl)}>
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

              return <Message key={i} role={msg.role} content={msg.content} />;
            })}

          {!isEmpty && thinkingSteps.length > 0 && <ThinkingPanel steps={thinkingSteps} />}
          {!isEmpty && isSearching && thinkingSteps.length === 0 && (
            <ThinkingPanel steps={['Searching the web']} />
          )}
          {!isEmpty && imgLoading && <ImageGeneratingAnimation />}
        </div>
      </div>

      <div
        className={
          'shrink-0 ' +
          (isEmpty
            ? 'px-3 sm:px-4 pb-8 sm:pb-12'
            : 'border-t border-zinc-200/80 dark:border-white/[0.06] bg-white/90 dark:bg-[#0c0c0f]/95 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))]')
        }
      >
        <div className={'mx-auto max-w-2xl ' + (isEmpty ? '' : 'px-3 sm:px-4 py-3')}>
          {imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {imagePreviews.map((p, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={p.previewUrl}
                    alt=""
                    className="h-14 w-14 object-cover rounded-lg border border-zinc-200 dark:border-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setImagePreviews((prev) => prev.filter((_, j) => j !== idx))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              <span className="text-[11px] text-zinc-400 self-end pb-1">{imagePreviews.length}/4</span>
            </div>
          )}

          {parsingFile && <p className="text-xs text-zinc-400 mb-1">Reading file…</p>}
          {attachedFile && !parsingFile && (
            <div className="flex items-center gap-2 mb-2 text-xs bg-zinc-100 dark:bg-white/5 rounded-lg px-2.5 py-1.5">
              <FileText size={14} className="text-zinc-500" />
              <span className="truncate flex-1">{attachedFile.name}</span>
              <button type="button" onClick={() => setAttachedFile(null)}>
                <X size={12} />
              </button>
            </div>
          )}
          {fileError && <p className="text-xs text-red-500 mb-1">{fileError}</p>}

          <div className="flex items-end gap-1 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-1.5 py-1.5 shadow-sm focus-within:border-zinc-400 dark:focus-within:border-white/25 transition-colors">
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
                onClick={() => setShowPlusMenu((o) => !o)}
                className="p-2.5 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 transition"
              >
                <Plus size={20} className={showPlusMenu ? 'rotate-45 transition-transform' : 'transition-transform'} />
              </button>
              {showPlusMenu && (
                <div className="absolute bottom-12 left-0 z-50 min-w-[180px] rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-xl p-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-zinc-100 dark:hover:bg-white/5"
                  >
                    <Paperclip size={15} /> Photos (max 4)
                  </button>
                  <button
                    type="button"
                    onClick={() => docInputRef.current && docInputRef.current.click()}
                    className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-zinc-100 dark:hover:bg-white/5"
                  >
                    <FileText size={15} /> File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForceImageGen(true);
                      setShowPlusMenu(false);
                      setTimeout(() => textareaRef.current && textareaRef.current.focus(), 50);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-zinc-100 dark:hover:bg-white/5"
                  >
                    <Wand2 size={15} /> Generate image
                  </button>
                </div>
              )}
            </div>

            {/* Mode next to + — General / Study / Coding */}
            <select
              value={mode || 'general'}
              onChange={(e) => setMode && setMode(e.target.value)}
              className="appearance-none shrink-0 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10
                text-xs font-medium text-zinc-700 dark:text-zinc-200 pl-2.5 pr-2 py-2 outline-none
                hover:bg-zinc-200/80 dark:hover:bg-white/10 cursor-pointer max-w-[100px] mb-0.5"
              aria-label="Mode"
            >
              <option value="general">General</option>
              <option value="study">Study</option>
              <option value="coding">Coding</option>
            </select>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="flex-1 resize-none bg-transparent text-[15px] text-zinc-900 dark:text-zinc-100 px-1 py-2.5 outline-none max-h-32 placeholder:text-zinc-400"
            />

            <button
              type="button"
              onClick={toggleListening}
              className={
                'p-2.5 rounded-xl transition ' +
                (isListening
                  ? 'text-red-500 bg-red-50 dark:bg-red-500/10'
                  : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10')
              }
            >
              <Mic size={20} />
            </button>

            <button
              type="button"
              onClick={sendMessage}
              disabled={loading || imgLoading}
              className="p-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 disabled:opacity-40 hover:opacity-90 transition shrink-0"
            >
              <Send size={18} />
            </button>
          </div>

          {!isEmpty && (
            <p className="text-[10px] text-center text-zinc-400 mt-2">
              SetrxAI can make mistakes. Check important info.
            </p>
          )}
        </div>
      </div>
    </div>
  );
