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
      : 'Type your message...';
