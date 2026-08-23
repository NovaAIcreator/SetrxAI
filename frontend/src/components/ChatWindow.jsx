// ChatWindow.jsx — PURA REPLACE (PART 1 of 2)

import { useState, useEffect, useRef } from 'react';
import { Paperclip, Mic, Send, X, FileText, Wand2, Plus, Globe, Image } from 'lucide-react';
import Message from './Message';
import ModeHero from './ModeHero';
import { api } from '../api';

function TypingDots() {
  const [step, setStep] = useState(0);
  const steps = [
    'Thinking...',
    'Analyzing your question...',
    'Reasoning through it...',
    'Checking details...',
    'Writing reply...',
  ];

  useEffect(() => {
    const t = setInterval(() => setStep((p) => (p + 1) % steps.length), 1700);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex gap-2 sm:gap-3 justify-start mb-3 px-2 sm:px-4">
      <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-xs opacity-90">✨</div>
      <div className="flex items-center gap-2 text-[13px] text-zinc-400/90">
        <span className="inline-block w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin shrink-0" />
        <span className="italic">{steps[step]}</span>
      </div>
    </div>
  );
}

function ImageGeneratingAnimation({ editing }) {
  const [step, setStep] = useState(0);
  const steps = editing
    ? [
        'Photo padh raha hoon...',
        'Details improve kar raha hoon...',
        'Lighting theek kar raha hoon...',
        'Final image bana raha hoon...',
        'Almost ready...',
      ]
    : [
        'Prompt samajh raha hoon...',
        'Scene plan kar raha hoon...',
        'Image generate ho rahi hai...',
        'Details add ho rahe hain...',
        'Final polish...',
        'Ready hone wala hai...',
      ];

  useEffect(() => {
    const t = setInterval(() => {
      setStep((p) => (p < steps.length - 1 ? p + 1 : p));
    }, 2200);
    return () => clearInterval(t);
  }, [editing]);

  return (
    <div className="flex gap-2 sm:gap-3 justify-start mb-3 px-2 sm:px-4">
      <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-xs opacity-90">🎨</div>
      <div className="flex items-center gap-2 text-[13px] text-zinc-400/90">
        <span className="inline-block w-3 h-3 border-2 border-fuchsia-400/30 border-t-fuchsia-400 rounded-full animate-spin shrink-0" />
        <span className="italic">{steps[step]}</span>
      </div>
    </div>
  );
}

function WebSearchAnimation() {
  const [step, setStep] = useState(0);
  const steps = [
    'Searching the web...',
    'Reading sources...',
    'Analyzing results...',
    'Preparing answer...',
  ];

  useEffect(() => {
    const t = setInterval(() => setStep((p) => (p + 1) % steps.length), 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex gap-2 sm:gap-3 justify-start mb-3 px-2 sm:px-4">
      <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs opacity-90">🌐</div>
      <div className="flex items-center gap-2 text-[13px] text-zinc-400/90">
        <Globe size={12} className="text-blue-400 animate-spin shrink-0" style={{ animationDuration: '1.6s' }} />
        <span className="italic">{steps[step]}</span>
      </div>
    </div>
  );
}

const IMAGE_KEYWORDS = ['image', 'photo', 'picture', 'draw', 'generate image', 'create image', 'banao image', 'tasveer', 'wallpaper', 'poster', 'illustration', 'portrait', 'painting', 'sketch', 'artwork', 'banao', 'bana do'];
const EDIT_KEYWORDS = ['edit', 'improve', 'enhance', 'better', 'fix', 'retouch', 'accha', 'acha', 'sudhar', 'badal', 'change', 'make it', 'photo ko', 'image ko', 'quality', 'clear', 'hd', 'upscale', 'lighting'];
const SEARCH_KEYWORDS = ['search', 'latest', 'news', 'today', 'current', 'now', 'recent', 'live', '2025', '2026', 'price', 'weather', 'score'];

function detectIntent(text, hasPhoto, forceImageGen) {
  const lower = (text || '').toLowerCase();
  if (hasPhoto && (!text || !text.trim() || EDIT_KEYWORDS.some(function (k) { return lower.includes(k); }) || IMAGE_KEYWORDS.some(function (k) { return lower.includes(k); }))) {
    return 'edit';
  }
  if (forceImageGen || IMAGE_KEYWORDS.some(function (k) { return lower.includes(k); })) return 'image';
  if (SEARCH_KEYWORDS.some(function (k) { return lower.includes(k); })) return 'search';
  return null;
}

export default function ChatWindow({ mode, sessionId, messages, setMessages, isGuest }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitingFirstChunk, setWaitingFirstChunk] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgEditing, setImgEditing] = useState(false);
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

  useEffect(function () { isNewSessionLoad.current = true; }, [sessionId]);

  useEffect(function () {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (isNewSessionLoad.current) {
      container.scrollTop = container.scrollHeight;
      isNewSessionLoad.current = false;
    } else if (shouldScrollRef.current) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      shouldScrollRef.current = false;
    }
  }, [messages]);

  useEffect(function () {
    const handler = function (e) {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setShowPlusMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return function () { document.removeEventListener('mousedown', handler); };
  }, []);

  useEffect(function () {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    recognition.onresult = function (e) {
      const t = e.results[0][0].transcript;
      setInput(function (prev) { return prev ? prev + ' ' + t : t; });
    };
    recognition.onend = function () { setIsListening(false); };
    recognition.onerror = function () { setIsListening(false); };
    recognitionRef.current = recognition;
  }, []);

  const toggleListening = function () {
    if (!recognitionRef.current) { alert('Voice not supported. Try Chrome.'); return; }
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { recognitionRef.current.start(); setIsListening(true); }
  };

  const handleImageSelect = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      const base64 = reader.result.split(',')[1];
      setImagePreview({ mimeType: file.type, data: base64, previewUrl: reader.result });
    };
    reader.readAsDataURL(file);
    setShowPlusMenu(false);
    e.target.value = '';
  };

  const handleDocSelect = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileError(''); setParsingFile(true); setAttachedFile(null);
    const reader = new FileReader();
    reader.onload = async function () {
      const base64 = reader.result.split(',')[1];
      try {
        const result = await api.parseFile(file.name, file.type, base64);
        setAttachedFile({ name: result.fileName, text: result.text });
      } catch (err) {
        setFileError(err.message || 'File parse failed');
      } finally {
        setParsingFile(false);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
    setShowPlusMenu(false);
  };

  const generateImage = async function (promptText, photo) {
    const prompt = (promptText || '').trim();
    if ((!prompt && !photo) || imgLoading) return;
    setImgLoading(true);
    setImgEditing(!!photo);
    setForceImageGen(false);
    lastImageJob.current = { prompt: prompt, photo: photo || null };
    shouldScrollRef.current = true;
    const userLabel = photo
      ? (prompt ? '✏️ Edit photo: "' + prompt + '"' : '✨ Improve this photo')
      : '🎨 Generate image: "' + prompt + '"';
    setMessages(function (prev) { return prev.concat([{ role: 'user', content: userLabel }]); });
    try {
      const token = localStorage.getItem('setrxai_token');
      const body = { prompt: prompt || 'make this photo high quality, sharp and natural' };
      if (photo && photo.data) {
        body.image = { mimeType: photo.mimeType, data: photo.data };
      }
      const res = await fetch('https://setrxai-backend.onrender.com/api/generate-image', {
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
      setMessages(function (prev) {
        return prev.concat([{
          role: 'assistant',
          content: '__IMAGE__' + data.imageUrl + '__PROMPT__' + (prompt || 'photo edit'),
        }]);
      });
    } catch (err) {
      setMessages(function (prev) {
        return prev.concat([{ role: 'assistant', content: '⚠️ Image generation failed: ' + err.message }]);
      });
    } finally {
      setImgLoading(false);
      setImgEditing(false);
    }
  };

  const useImageForEdit = async function (imgUrl) {
    try {
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = function () {
        const base64 = reader.result.split(',')[1];
        setImagePreview({ mimeType: blob.type || 'image/jpeg', data: base64, previewUrl: reader.result });
        setForceImageGen(true);
        if (textareaRef.current) textareaRef.current.focus();
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      alert('Image load nahi hui edit ke liye');
    }
  };

  const sendMessage = async function () {
    if ((!input.trim() && !imagePreview && !attachedFile) || loading || imgLoading) return;

    const intent = detectIntent(input, !!imagePreview, forceImageGen);

    if (intent === 'image' || intent === 'edit') {
      const photo = imagePreview;
      const prompt = input;
      setInput('');
      setImagePreview(null);
      setForceImageGen(false);
      await generateImage(prompt, photo);
      return;
    }

    const displayText = input || (attachedFile ? '📄 "' + attachedFile.name + '"' : '(Image sent)');
    const userMessage = { role: 'user', content: displayText };
    const updatedMessages = messages.concat([userMessage]);
    shouldScrollRef.current = true;
    setMessages(updatedMessages);
    const imageToSend = imagePreview ? { mimeType: imagePreview.mimeType, data: imagePreview.data } : null;
    const fileToSend = attachedFile ? { name: attachedFile.name, text: attachedFile.text } : null;
    setInput(''); setImagePreview(null); setAttachedFile(null); setForceImageGen(false);
    setLoading(true); setWaitingFirstChunk(true);
    if (intent === 'search') setIsSearching(true);
    setMessages(function (prev) { return prev.concat([{ role: 'assistant', content: '' }]); });
    try {
      const response = await api.chatStream(mode, updatedMessages, isGuest ? null : sessionId, imageToSend, fileToSend);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.indexOf('data:') !== 0) continue;
          const jsonStr = line.replace('data:', '').trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.chunk) {
              setWaitingFirstChunk(false);
              setIsSearching(false);
              setMessages(function (prev) {
                const updated = prev.slice();
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = { role: last.role, content: last.content + parsed.chunk };
                return updated;
              });
            }
            if (parsed.error) {
              setWaitingFirstChunk(false);
              setIsSearching(false);
              setMessages(function (prev) {
                const u = prev.slice();
                u[u.length - 1] = { role: 'assistant', content: '⚠️ ' + parsed.error };
                return u;
              });
            }
          } catch (e) { }
        }
      }
    } catch (err) {
      setWaitingFirstChunk(false);
      setIsSearching(false);
      setMessages(function (prev) {
        const u = prev.slice();
        u[u.length - 1] = { role: 'assistant', content: '⚠️ Connection error, please try again.' };
        return u;
      });
    } finally {
      setLoading(false);
      setWaitingFirstChunk(false);
      setIsSearching(false);
    }
  };

  const handleKeyDown = function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const displayMessages = waitingFirstChunk ? messages.slice(0, -1) : messages;

  const placeholder = imagePreview
    ? 'Photo attached — type "accha banao" to edit, or ask about it...'
    : forceImageGen
      ? 'Describe the image you want...'
      : 'Type your message...'
   return (
    <div className="flex flex-col h-full min-h-0">
      <style>{`
        @keyframes imagePop { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .image-pop { animation: imagePop 0.35s ease-out both; }
      `}</style>

      {lightbox && (
        <div className="fixed inset-0 z-[80] bg-black/85 flex items-center justify-center p-4" onClick={function () { setLightbox(null); }}>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}

      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto py-4 max-w-5xl mx-auto w-full">
        {messages.length === 0 && <ModeHero mode={mode} onSelect={function (text) { setInput(text); }} />}

        {displayMessages.map(function (msg, i) {
          if (msg.role === 'assistant' && msg.content && msg.content.indexOf('__IMAGE__') === 0) {
            const rest = msg.content.replace('__IMAGE__', '');
            const splitAt = rest.indexOf('__PROMPT__');
            const imgUrl = splitAt >= 0 ? rest.slice(0, splitAt) : rest;
            const imgPrompt = splitAt >= 0 ? rest.slice(splitAt + 10) : '';
            return (
              <div key={i} className="flex gap-2 sm:gap-3 justify-start mb-4 px-2 sm:px-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-xs">✨</div>
                <div className="flex flex-col gap-2 max-w-sm">
                  <button type="button" className="image-pop rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 shadow-lg text-left" onClick={function () { setLightbox(imgUrl); }}>
                    <img
                      src={imgUrl}
                      alt={imgPrompt}
                      className="w-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={function (e) {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <p style={{ display: 'none' }} className="text-xs text-red-400 p-3 text-center">
                      ⚠️ Image load nahi hui — download try karo
                    </p>
                  </button>
                  {imgPrompt ? <p className="text-xs text-zinc-400 px-1">✨ "{imgPrompt}"</p> : null}
                  <div className="flex flex-wrap gap-2 px-1">
                    <a href={imgUrl} target="_blank" rel="noreferrer" className="text-xs text-purple-500 hover:text-purple-400">⬇️ Download</a>
                    <button type="button" className="text-xs text-fuchsia-400 hover:text-fuchsia-300" onClick={function () { useImageForEdit(imgUrl); }}>✏️ Edit this</button>
                    <button
                      type="button"
                      className="text-xs text-zinc-400 hover:text-zinc-200"
                      onClick={function () {
                        const job = lastImageJob.current;
                        if (job) generateImage(job.prompt, job.photo);
                        else generateImage(imgPrompt, null);
                      }}
                    >🔁 Again</button>
                  </div>
                </div>
              </div>
            );
          }
          return <Message key={i} role={msg.role} content={msg.content} />;
        })}

        {waitingFirstChunk && !isSearching && <TypingDots />}
        {isSearching && <WebSearchAnimation />}
        {imgLoading && <ImageGeneratingAnimation editing={imgEditing} />}
      </div>

      <div className="p-3 sm:p-4">
        <div className="max-w-5xl mx-auto">
          {imagePreview && (
            <div className="mb-2 flex items-end gap-2">
              <div className="relative inline-block">
                <img src={imagePreview.previewUrl} alt="preview" className="h-20 rounded-lg border border-zinc-300 dark:border-white/10 shadow-md" />
                <button onClick={function () { setImagePreview(null); }} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                  <X size={12} />
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 pb-1">Send empty = improve photo · or type what to change</p>
            </div>
          )}
          {parsingFile && (
            <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
              <FileText size={14} className="text-purple-400 animate-pulse" />
              <span className="italic">Reading file...</span>
            </div>
          )}
          {attachedFile && !parsingFile && (
            <div className="mb-2 flex items-center gap-2 bg-white dark:bg-white/[0.06] border border-purple-200 dark:border-purple-500/20 rounded-xl px-3 py-2 text-xs">
              <FileText size={15} className="text-purple-500 shrink-0" />
              <span className="truncate flex-1 text-zinc-700 dark:text-zinc-300">{attachedFile.name}</span>
              <button onClick={function () { setAttachedFile(null); setFileError(''); }} className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                <X size={12} />
              </button>
            </div>
          )}
          {fileError && <div className="mb-2 text-xs text-red-500">⚠️ {fileError}</div>}

          <div className="flex items-center gap-1 bg-white dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 rounded-2xl px-2 py-1.5 shadow-lg backdrop-blur-sm focus-within:ring-2 focus-within:ring-purple-500/40 relative">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
            <input type="file" accept=".pdf,.docx,.txt,.csv,.js,.jsx,.ts,.tsx,.py,.json,.md,.html,.css,.java,.c,.cpp,.xml,.yml,.yaml,.log" ref={docInputRef} onChange={handleDocSelect} className="hidden" />

            <div className="relative" ref={plusMenuRef}>
              <button
                onClick={function () { setShowPlusMenu(function (o) { return !o; }); }}
                className={'shrink-0 p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 ' + (showPlusMenu ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600' : 'text-zinc-500 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-500/10')}
                title="More options"
              >
                <Plus size={20} strokeWidth={2} className={'transition-transform duration-200 ' + (showPlusMenu ? 'rotate-45' : '')} />
              </button>

              {showPlusMenu && (
                <div className="absolute bottom-12 left-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 min-w-[200px] z-50">
                  <button onClick={function () { fileInputRef.current && fileInputRef.current.click(); }} className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-zinc-700 dark:text-zinc-200 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all">
                    <Paperclip size={16} className="text-purple-500" /> Attach Image
                  </button>
                  <button onClick={function () { docInputRef.current && docInputRef.current.click(); }} className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-zinc-700 dark:text-zinc-200 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all">
                    <FileText size={16} className="text-purple-500" /> Attach File
                  </button>
                  <button onClick={function () { setForceImageGen(true); setShowPlusMenu(false); setTimeout(function () { textareaRef.current && textareaRef.current.focus(); }, 50); }} className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-zinc-700 dark:text-zinc-200 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all">
                    <Wand2 size={16} className="text-purple-500" /> Generate Image
                  </button>
                  <button onClick={function () { fileInputRef.current && fileInputRef.current.click(); setForceImageGen(true); }} className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-zinc-700 dark:text-zinc-200 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all">
                    <Image size={16} className="text-fuchsia-500" /> Edit / Improve Photo
                  </button>
                  <button onClick={function () { setInput(function (prev) { return prev + ' search: '; }); setShowPlusMenu(false); }} className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-zinc-700 dark:text-zinc-200 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all">
                    <Globe size={16} className="text-blue-500" /> Web Search
                  </button>
                </div>
              )}
            </div>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={function (e) { setInput(e.target.value); }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="flex-1 resize-none bg-transparent text-zinc-900 dark:text-zinc-100 text-sm sm:text-base px-1 py-2 outline-none max-h-32"
            />

            <button onClick={toggleListening} className={'shrink-0 p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 ' + (isListening ? 'text-red-500 bg-red-100 dark:bg-red-500/20 animate-pulse' : 'text-zinc-500 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-500/10')} title="Voice input">
              <Mic size={20} strokeWidth={2} />
            </button>

            <button onClick={sendMessage} disabled={loading || imgLoading} className="bg-gradient-to-br from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-white rounded-xl p-2.5 transition-all duration-200 shrink-0 hover:scale-110 active:scale-95 shadow-md">
              <Send size={20} strokeWidth={2} className={(loading || imgLoading) ? 'animate-pulse' : ''} />
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 text-center mt-1.5">
            Same chat: type to talk · attach photo to edit · "banao image" to generate
          </p>
        </div>
      </div>
    </div>
  );
}
