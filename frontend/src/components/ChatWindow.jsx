// ChatWindow.jsx — PURA REPLACE KARO

import { useState, useEffect, useRef } from 'react';
import { Paperclip, Mic, Send, X, FileText, Wand2, Plus, Globe, Image } from 'lucide-react';
import Message from './Message';
import ModeHero from './ModeHero';
import { api } from '../api';

function TypingDots() {
  return (
    <div className="flex gap-2 sm:gap-3 justify-start mb-4 px-2 sm:px-4">
      <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-xs animate-pulse">✨</div>
      <div className="flex items-center gap-1.5 bg-white dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 rounded-2xl rounded-bl-md px-4 py-3.5">
        <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0s' }} />
        <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
        <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
}

function ImageGeneratingAnimation() {
  const [dots, setDots] = useState('');
  const [step, setStep] = useState(0);
  const steps = ['Initializing AI...', 'Processing prompt...', 'Generating pixels...', 'Adding details...', 'Almost ready...'];

  useEffect(() => {
    const d = setInterval(() => setDots((p) => p.length >= 3 ? '' : p + '.'), 500);
    const s = setInterval(() => setStep((p) => (p + 1) % steps.length), 2000);
    return () => { clearInterval(d); clearInterval(s); };
  }, []);

  return (
    <div className="flex gap-2 sm:gap-3 justify-start mb-4 px-2 sm:px-4">
      <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-xs animate-pulse">🎨</div>
      <div className="flex flex-col gap-3 bg-white dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 rounded-2xl rounded-bl-md px-4 py-3.5 min-w-[260px] max-w-xs">
        <div className="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/20 to-fuchsia-900/20 border border-purple-500/20">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 flex items-center justify-center">
                <span className="text-3xl animate-bounce">🖼️</span>
              </div>
              <div className="absolute -inset-3 rounded-full border-2 border-purple-500/20 animate-ping" />
              <div className="absolute -inset-6 rounded-full border border-fuchsia-500/10 animate-ping" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
            style={{ animation: 'scan 2s ease-in-out infinite' }} />
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-purple-400/60 rounded-tl" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-purple-400/60 rounded-tr" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-purple-400/60 rounded-bl" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-purple-400/60 rounded-br" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[0,1,2].map((i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{steps[step]}{dots}</span>
        </div>
        <div className="relative h-1 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 rounded-full"
            style={{ animation: 'progress 3s ease-in-out infinite' }} />
        </div>
      </div>
    </div>
  );
}

function WebSearchAnimation() {
  const [dots, setDots] = useState('');
  const [step, setStep] = useState(0);
  const steps = [
    'Connecting to search engines...',
    'Scanning web sources...',
    'Filtering relevant results...',
    'Extracting key insights...',
    'Compiling answer...',
  ];
  const sources = ['Google', 'News', 'Wikipedia', 'Live data'];

  useEffect(() => {
    const d = setInterval(() => setDots((p) => (p.length >= 3 ? '' : p + '.')), 400);
    const s = setInterval(() => setStep((p) => (p + 1) % steps.length), 1800);
    return () => { clearInterval(d); clearInterval(s); };
  }, []);

  return (
    <div className="flex gap-2 sm:gap-3 justify-start mb-4 px-2 sm:px-4">
      <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs animate-pulse">🌐</div>
      <div className="flex flex-col gap-2.5 bg-white dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 rounded-2xl rounded-bl-md px-4 py-3.5 min-w-[260px] max-w-xs">
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-blue-500 animate-spin" style={{ animationDuration: '2s' }} />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Web Search</span>
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-500 font-medium">LIVE</span>
        </div>
        <div className="relative h-16 rounded-xl overflow-hidden bg-gradient-to-br from-blue-900/10 to-cyan-900/10 border border-blue-500/20 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border border-blue-500/30 animate-ping" />
            <div className="absolute w-6 h-6 rounded-full border border-cyan-400/40 animate-ping" style={{ animationDelay: '0.4s' }} />
            <div className="absolute w-3 h-3 rounded-full bg-blue-500/60 animate-pulse" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
            style={{ animation: 'scan 2s ease-in-out infinite' }} />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{steps[step]}{dots}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sources.map((s, i) => (
            <span
              key={s}
              className="text-[10px] px-2 py-0.5 rounded-full border border-blue-500/20 text-blue-500/80 bg-blue-500/5"
              style={{ opacity: step >= i ? 1 : 0.35, transition: 'opacity 0.4s' }}
            >
              {s}
            </span>
          ))}
        </div>
        <div className="relative h-1 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-400 rounded-full"
            style={{ animation: 'progress 3s ease-in-out infinite' }} />
        </div>
      </div>
    </div>
  );
}

const IMAGE_KEYWORDS = ['image', 'photo', 'picture', 'draw', 'generate image', 'create image', 'banao image', 'tasveer', 'wallpaper', 'poster', 'illustration', 'portrait', 'painting', 'sketch', 'artwork'];
const SEARCH_KEYWORDS = ['search', 'latest', 'news', 'today', 'current', 'now', 'recent', 'live', '2025', '2026', 'price', 'weather', 'score'];

function detectIntent(text) {
  const lower = text.toLowerCase();
  if (IMAGE_KEYWORDS.some((k) => lower.includes(k))) return 'image';
  if (SEARCH_KEYWORDS.some((k) => lower.includes(k))) return 'search';
  return null;
}

export default function ChatWindow({ mode, sessionId, messages, setMessages, isGuest }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitingFirstChunk, setWaitingFirstChunk] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [imagePromptText, setImagePromptText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [parsingFile, setParsingFile] = useState(false);
  const [fileError, setFileError] = useState('');

  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const plusMenuRef = useRef(null);
  const isNewSessionLoad = useRef(true);
  const shouldScrollRef = useRef(false);

  useEffect(() => { isNewSessionLoad.current = true; }, [sessionId]);

  useEffect(() => {
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

  useEffect(() => {
    const handler = (e) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setShowPlusMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    recognition.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setInput((prev) => (prev ? prev + ' ' + t : t));
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) { alert('Voice not supported. Try Chrome.'); return; }
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { recognitionRef.current.start(); setIsListening(true); }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      setImagePreview({ mimeType: file.type, data: base64, previewUrl: reader.result });
    };
    reader.readAsDataURL(file);
    setShowPlusMenu(false);
  };

  const handleDocSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileError(''); setParsingFile(true); setAttachedFile(null);
    const reader = new FileReader();
    reader.onload = async () => {
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

  const generateImage = async (promptOverride) => {
    const prompt = (promptOverride || imagePromptText || input).trim();
    if (!prompt || imgLoading) return;
    setImgLoading(true);
    setShowImagePrompt(false);
    setImagePromptText('');
    setInput('');
    shouldScrollRef.current = true;
    setMessages((prev) => [...prev, { role: 'user', content: `🎨 Generate image: "${prompt}"` }]);
    try {
      const token = localStorage.getItem('setrxai_token');
      const res = await fetch('https://setrxai-backend.onrender.com/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      shouldScrollRef.current = true;
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `__IMAGE__\( {data.imageUrl}__PROMPT__ \){prompt}`,
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ Image generation failed: ${err.message}` }]);
    } finally {
      setImgLoading(false);
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !imagePreview && !attachedFile) || loading) return;
    const intent = detectIntent(input);
    const displayText = input || (attachedFile ? `📄 "${attachedFile.name}"` : '(Image sent)');
    const userMessage = { role: 'user', content: displayText };
    const updatedMessages = [...messages, userMessage];
    shouldScrollRef.current = true;
    setMessages(updatedMessages);
    const imageToSend = imagePreview ? { mimeType: imagePreview.mimeType, data: imagePreview.data } : null;
    const fileToSend = attachedFile ? { name: attachedFile.name, text: attachedFile.text } : null;
    setInput(''); setImagePreview(null); setAttachedFile(null);
    setLoading(true); setWaitingFirstChunk(true);
    if (intent === 'search') setIsSearching(true);
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
    try {
      const response = await api.chatStream(mode, updatedMessages, isGuest ? null : sessionId, imageToSend, fileToSend);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.replace('data:', '').trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.chunk) {
              setWaitingFirstChunk(false);
              setIsSearching(false);
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: updated[updated.length - 1].content + parsed.chunk };
                return updated;
              });
            }
            if (parsed.error) {
              setWaitingFirstChunk(false);
              setIsSearching(false);
              setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: `⚠️ ${parsed.error}` }; return u; });
            }
          } catch (e) { }
        }
      }
    } catch (err) {
      setWaitingFirstChunk(false);
      setIsSearching(false);
      setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: '⚠️ Connection error, please try again.' }; return u; });
    } finally {
      setLoading(false);
      setWaitingFirstChunk(false);
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const displayMessages = waitingFirstChunk ? messages.slice(0, -1) : messages;

  return (
    <div className="flex flex-col h-full min-h-0">
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes imagePop { 0% { transform: scale(0.9); opacity: 0; } 60% { transform: scale(1.02); } 100% { transform: scale(1); opacity: 1; } }
        .image-pop { animation: imagePop 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes progress {
          0% { width: 5%; }
          50% { width: 80%; }
          100% { width: 95%; }
        }
      `}</style>

      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto py-4 max-w-5xl mx-auto w-full">
        {messages.length === 0 && <ModeHero mode={mode} onSelect={(text) => setInput(text)} />}

        {displayMessages.map((msg, i) => {
          if (msg.role === 'assistant' && msg.content?.startsWith('__IMAGE__')) {
            const parts = msg.content.replace('__IMAGE__', '').split('__PROMPT__');
            const imgUrl = parts[0];
            const imgPrompt = parts[1] || '';
            return (
              <div key={i} className="flex gap-2 sm:gap-3 justify-start mb-4 px-2 sm:px-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-xs">✨</div>
                <div className="flex flex-col gap-2 max-w-sm">
                  <div className="image-pop rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 shadow-lg">
                    <img
                      src={imgUrl}
                      alt={imgPrompt}
                      className="w-full object-cover"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <p style={{ display: 'none' }} className="text-xs text-red-400 p-3 text-center">
                      ⚠️ Image load nahi hui — download try karo
                    </p>
                  </div>
                  <p className="text-xs text-zinc-400 px-1">✨ "{imgPrompt}"</p>
                  <a href={imgUrl} download={`setrxai-${Date.now()}.jpg`} className="flex items-center gap-1.5 text-xs text-purple-500 hover:text-purple-400 px-1 transition-colors">
                    ⬇️ Download image
                  </a>
                </div>
              </div>
            );
          }
          return <Message key={i} role={msg.role} content={msg.content} />;
        })}

        {waitingFirstChunk && !isSearching && <TypingDots />}
        {isSearching && <WebSearchAnimation />}
        {imgLoading && <ImageGeneratingAnimation />}
      </div>

      {showImagePrompt && (
        <div className="px-3 sm:px-4 pb-2 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-2xl px-3 py-2 animate-fadeInUp">
            <Image size={16} className="text-purple-500 shrink-0" />
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium shrink-0">Image:</span>
            <input
              autoFocus
              value={imagePromptText}
              onChange={(e) => setImagePromptText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') generateImage(); if (e.key === 'Escape') setShowImagePrompt(fals
