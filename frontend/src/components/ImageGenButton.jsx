import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Download, Wand2 } from 'lucide-react';
import { api } from '../api';

// ── Keyword detection ──
const IMAGE_KEYWORDS = [
  'image', 'photo', 'picture', 'draw', 'generate', 'create',
  'banao', 'bana', 'dikhao', 'tasveer', 'photo', 'design',
  'illustration', 'portrait', 'landscape', 'sketch', 'paint',
  'scenery', 'wallpaper', 'poster', 'logo', 'icon', 'art',
];

export function detectImageIntent(text) {
  const lower = text.toLowerCase();
  return IMAGE_KEYWORDS.some((kw) => lower.includes(kw));
}

// ── Particles animation ──
function Particles({ active }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: `hsl(${260 + i * 15}, 80%, 65%)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `particle-float ${1.5 + Math.random()}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 1.5}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function ImageGenButton({ inputText = '', onImageGenerated }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const promptRef = useRef(null);
  const timerRef = useRef(null);

  // Auto-fill prompt from chat input when keyword detected
  useEffect(() => {
    if (detectImageIntent(inputText) && inputText.length > 3) {
      setPrompt(inputText);
    }
  }, [inputText]);

  // Auto-open when keyword detected in chat
  useEffect(() => {
    if (detectImageIntent(inputText) && inputText.length > 8) {
      setOpen(true);
    }
  }, [inputText]);

  // Progress bar animation while loading
  useEffect(() => {
    if (loading) {
      setProgress(0);
      timerRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) return 90;
          return p + Math.random() * 8;
        });
      }, 400);
    } else {
      clearInterval(timerRef.current);
      if (imageUrl) setProgress(100);
      else setProgress(0);
    }
    return () => clearInterval(timerRef.current);
  }, [loading, imageUrl]);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setImageUrl(null);
    setError('');
    try {
      const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const token = localStorage.getItem('setrxai_token');
      const res = await fetch(`${BACKEND}/api/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setImageUrl(data.imageUrl);
      setProgress(100);
      if (onImageGenerated) onImageGenerated(data.imageUrl, prompt);
    } catch (err) {
      setError(err.message || 'Kuch gadbad ho gayi, dobara try karo');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') generate();
  };

  const downloadImage = async () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `setrxai-${Date.now()}.png`;
    a.click();
  };

  const reset = () => {
    setImageUrl(null);
    setError('');
    setProgress(0);
    setPrompt('');
  };

  return (
    <>
      {/* ── CSS animations ── */}
      <style>{`
        @keyframes particle-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
          50% { transform: translateY(-18px) scale(1.3); opacity: 1; }
        }
        @keyframes shimmer-move {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(22px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(22px) rotate(-360deg); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes imagePop {
          0% { transform: scale(0.85); opacity: 0; }
          60% { transform: scale(1.04); }
          100% { transform: scale(1); opacity: 1; }
        }
        .image-pop { animation: imagePop 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        .fade-slide-up { animation: fadeSlideUp 0.3s ease both; }
        .shimmer-bar::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: shimmer-move 1.2s infinite;
        }
      `}</style>

      {/* ── Floating button ── */}
      <div className="relative">
        <button
          onClick={() => { setOpen((o) => !o); setTimeout(() => promptRef.current?.focus(), 100); }}
          title="Type prompt and generate image"
          className={`
            relative shrink-0 p-2.5 rounded-xl transition-all duration-300
            hover:scale-110 active:scale-95 overflow-hidden
            ${open
              ? 'bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30'
              : 'text-zinc-500 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-500/10'
            }
          `}
        >
          {/* Orbit ring when open */}
          {open && (
            <span className="absolute inset-0 rounded-xl border-2 border-purple-400/40 animate-ping pointer-events-none" />
          )}
          <Wand2 size={20} strokeWidth={2} className={open ? 'animate-pulse' : ''} />
          {/* Label below button */}
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] whitespace-nowrap text-purple-500 font-medium opacity-0 group-hover:opacity-100 pointer-events-none select-none hidden sm:block">
            Generate Image
          </span>
        </button>
      </div>

      {/* ── Popup panel ── */}
      {open && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[340px] sm:w-[400px] z-50 fade-slide-up">
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden">
            <Particles active={loading} />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-md">
                  <Sparkles size={14} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  AI Image Generator
                </span>
              </div>
              <button
                onClick={() => { setOpen(false); reset(); }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              {/* Prompt input */}
              <div className="flex gap-2">
                <input
                  ref={promptRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type prompt and generate image..."
                  disabled={loading}
                  className="flex-1 text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/40 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 disabled:opacity-50 transition-all"
                />
                <button
                  onClick={generate}
                  disabled={loading || !prompt.trim()}
                  className="px-4 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-40 text-white text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-md"
                >
                  {loading ? '...' : 'Go'}
                </button>
              </div>

              {/* Progress bar */}
              {(loading || progress > 0) && (
                <div className="relative h-1.5 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden shimmer-bar">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div className="flex items-center gap-3 py-2">
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0 rounded-full border-2 border-purple-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-purple-500 animate-spin" />
                    <div className="absolute inset-1 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Generating your image...</p>
                    <p className="text-xs text-zinc-400">AI kaam kar raha hai, 10-30 sec wait karo ✨</p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-3 py-2.5">
                  <span className="text-red-500 text-sm">⚠️ {error}</span>
                  <button onClick={reset} className="ml-auto text-xs text-red-400 hover:text-red-600 underline">Retry</button>
                </div>
              )}

              {/* Result image */}
              {imageUrl && !loading && (
                <div className="space-y-2 image-pop">
                  <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 shadow-lg">
                    <img
                      src={imageUrl}
                      alt={prompt}
                      className="w-full object-cover max-h-64"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <p className="absolute bottom-2 left-3 right-3 text-xs text-white/80 truncate">{prompt}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={downloadImage}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-purple-100 dark:hover:bg-purple-500/10 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-all hover:scale-[1.02]"
                    >
                      <Download size={13} /> Download
                    </button>
                    <button
                      onClick={reset}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white text-xs font-medium transition-all hover:scale-[1.02] shadow"
                    >
                      <Wand2 size={13} /> New Image
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
  }
