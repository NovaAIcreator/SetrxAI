// ChatWindow.jsx — PURA REPLACE KARO

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

function ImageGeneratingAnimation() {
  const [step, setStep] = useState(0);
  const steps = [
    'Understanding your prompt...',
    'Generating image...',
    'Adding details...',
    'Almost done...',
  ];

  useEffect(() => {
    const t = setInterval(() => setStep((p) => (p + 1) % steps.length), 2000);
    return () => clearInterval(t);
  }, []);

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
    setMessages((prev) => [...prev, { role: 'user', content: '🎨 Generate image: "' + prompt + '"' }]);
    try {
      const token = localStorage.getItem('setrxai_token');
      const res = await fetch('https://setrxai-backend.onrender.com/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      shouldScrollRef.current = true;
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: '__IMAGE__' + data.imageUrl + '__PROMPT__' + prompt,
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Image generation failed: ' + err.message }]);
    } finally {
      setImgLoading(false);
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !imagePreview && !attachedFile) || loading) return;
    const intent = detectIntent(input);
    const displayText = input || (attachedFile ? '📄 "' + attachedFile.name + '"' : '(Image sent)');
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
              setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: '⚠️ ' + parsed.error }; return u; });
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
        @keyframes imagePop { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .image-pop { animation: imagePop 0.35s ease-out both; }
      `}</style>

      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto py-4 max-w-5xl mx-auto w-full">
        {messages.length === 0 && <ModeHero mode={mode} onSelect={(text) => setInput(text)} />}

        {displayMessages.map((msg, i) => {
          if (msg.role === 'assistant' && msg.content && msg.content.indexOf('__IMAGE__') === 0) {
            const rest = msg.content.replace('__IMAGE__', '');
            const splitAt = rest.indexOf('__PROMPT__');
            const imgUrl = splitAt >= 0 ? rest.slice(0, splitAt) : rest;
            const imgPrompt = splitAt >= 0 ? rest.slice(splitAt + 10) : '';
            return (
              <div key={i} className="flex gap-2 sm:gap-3 justify-start mb-4 px-2 sm:px-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-xs">✨</div>
                <div className="flex flex-col gap-2 max-w-sm">
                  <div className="image-pop rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 shadow-lg">
                    <img
                      src={imgUrl}
                      alt={imgPrompt}
                      className="w-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <p style={{ display: 'none' }} className="text-xs text-red-400 p-3 text-center">
                      ⚠️ Image load nahi hui — download try karo
                    </p>
                  </div>
                  {imgPrompt ? <p className="text-xs text-zinc-400 px-1">✨ "{imgPrompt}"</p> : null}
                  <a href={imgUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-purple-500 hover:text-purple-400 px-1 transition-colors">
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
          <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-2xl px-3 py-2">
            <Image size={16} className="text-purple-500 shrink-0" />
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium shrink-0">Image:</span>
            <input
              autoFocus
              value={imagePromptText}
              onChange={(e) => setImagePromptText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') generateImage(); if (e.key === 'Escape') setShowImagePrompt(false); }}
              placeholder="Describe the image you want..."
              className="flex-1 bg-transparent text-sm outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
            <button onClick={() => generateImage()} disabled={!imagePromptText.trim()} className="shrink-0 px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs font-semibold disabled:opacity-40">
              Generate
            </button>
            <button onClick={() => setShowImagePrompt(false)} className="shrink-0 text-zinc-400 hover:text-zinc-600">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="p-3 sm:p-4">
        <div className="max-w-5xl mx-auto">
          {imagePreview && (
            <div className="mb-2 relative inline-block">
              <img src={imagePreview.previewUrl} alt="preview" className="h-20 rounded-lg border border-zinc-300 dark:border-white/10 shadow-md" />
              <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                <X size={12} />
              </button>
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
              <button onClick={() => { setAttachedFile(null); setFileError(''); }} className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
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
                onClick={() => setShowPlusMenu((o) => !o)}
                className={`shrink-0 p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 ${showPlusMenu ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600' : 'text-zinc-500 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-500/10'}`}
                title="More options"
              >
                <Plus size={20} strokeWidth={2} className={`transition-transform duration-200 ${showPlusMenu ? 'rotate-45' : ''}`} />
              </button>

              {showPlusMenu && (
                <div className="absolute bottom-12 left-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 min-w-[180px] z-50">
                  <button onClick={() => { fileInputRef.current && fileInputRef.current.click(); }} className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-zinc-700 dark:text-zinc-200 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all">
                    <Paperclip size={16} className="text-purple-500" /> Attach Image
                  </button>
                  <button onClick={() => { docInputRef.current && docInputRef.current.click(); }} className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-zinc-700 dark:text-zinc-200 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all">
                    <FileText size={16} className="text-purple-500" /> Attach File
                  </button>
                  <button onClick={() => { setShowImagePrompt(true); setShowPlusMenu(false); }} className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-zinc-700 dark:text-zinc-200 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all">
                    <Wand2 size={16} className="text-purple-500" /> Generate Image
                  </button>
                  <button onClick={() => { setInput((prev) => prev + ' search: '); setShowPlusMenu(false); }} className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-zinc-700 dark:text-zinc-200 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all">
                    <Globe size={16} className="text-blue-500" /> Web Search
                  </button>
                </div>
              )}
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-zinc-900 dark:text-zinc-100 text-sm sm:text-base px-1 py-2 outline-none max-h-32"
            />

            <button onClick={toggleListening} className={`shrink-0 p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 ${isListening ? 'text-red-500 bg-red-100 dark:bg-red-500/20 animate-pulse' : 'text-zinc-500 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-500/10'}`} title="Voice input">
              <Mic size={20} strokeWidth={2} />
            </button>

            <button onClick={sendMessage} disabled={loading} className="bg-gradient-to-br from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-white rounded-xl p-2.5 transition-all duration-200 shrink-0 hover:scale-110 active:scale-95 shadow-md">
              <Send size={20} strokeWidth={2} className={loading ? 'animate-pulse' : ''} />
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 text-center mt-1.5">
            Press + for image generation, file upload & web search
          </p>
        </div>
      </div>
    </div>
  );
}
