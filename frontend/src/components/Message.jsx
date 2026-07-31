// Message.jsx
// Clean icons + smooth hover animations + image click-to-zoom (lightbox) +
// download button on generated images

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Copy, Check, Volume2, VolumeX, ImageDown, Loader2, X, Download } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';

function CodeBlock({ className, children }) {
  const [copied, setCopied] = useState(false);
  const codeText = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative my-4 group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-zinc-300 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 hover:scale-105 active:scale-95"
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="rounded-xl overflow-x-auto text-sm !bg-zinc-950 p-4 shadow-md">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

function ImageLightbox({ src, alt, onClose }) {
  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `setrxai-image-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeInUp"
      onClick={onClose}
    >
      <button
        onClick={handleDownload}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all hover:scale-105 active:scale-95"
      >
        <Download size={18} /> Download
      </button>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-90"
      >
        <X size={22} />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ---- Generated image ke upar hover pe dikhne wala download button ----
function GeneratedImage({ src, alt, onZoom }) {
  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `setrxai-image-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <div className="relative inline-block group/img my-3">
      <img
        src={src}
        alt={alt}
        onClick={onZoom}
        className="rounded-xl max-w-full sm:max-w-md shadow-lg cursor-zoom-in hover:opacity-90 transition-opacity"
      />
      <button
        onClick={handleDownload}
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all duration-200 hover:scale-110 active:scale-90"
        title="Download image"
      >
        <Download size={16} />
      </button>
    </div>
  );
}

function Message({ role, content }) {
  const isUser = role === 'user';
  const [downloading, setDownloading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const bubbleRef = useRef(null);

  const downloadAsImage = async () => {
    if (!bubbleRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(bubbleRef.current, {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0a0a12' : '#ffffff',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `setrxai-notes-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Image export failed', e);
    } finally {
      setDownloading(false);
    }
  };

  const toggleSpeak = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const cleanText = content.replace(/[#*`_>\-]/g, '').replace(/\n+/g, '. ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  if (isUser) {
    return (
      <div className="flex justify-end gap-2 sm:gap-3 mb-6 px-2 sm:px-4 md:px-8 animate-fadeInUp">
        <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl rounded-br-md px-4 py-2.5 sm:px-5 sm:py-3 text-lg leading-relaxed break-words shadow-md bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 px-2 sm:px-4 md:px-8 animate-fadeInUp">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-xs shadow-md">
          ✨
        </div>
        <span className="text-xs font-medium text-zinc-500">SetrxAI</span>
      </div>

      <div ref={bubbleRef} className="max-w-full md:max-w-3xl text-lg sm:text-xl leading-[1.8] text-zinc-800 dark:text-zinc-200">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            h2: ({ children }) => <h2 className="text-2xl sm:text-3xl font-bold mt-7 mb-4 first:mt-0 text-zinc-900 dark:text-white">{children}</h2>,
            h3: ({ children }) => <h3 className="text-xl sm:text-2xl font-semibold mt-6 mb-3 first:mt-0 text-zinc-900 dark:text-white">{children}</h3>,
            p: ({ children }) => <p className="mb-5 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-bold text-xl sm:text-2xl text-purple-700 dark:text-purple-400">{children}</strong>,
            ul: ({ children }) => <ul className="list-disc pl-6 mb-5 space-y-2.5">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-6 mb-5 space-y-2.5">{children}</ol>,
            li: ({ children }) => <li className="pl-1">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-500/10 pl-4 pr-3 py-3 my-5 rounded-r-lg text-lg">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-5">
                <table className="w-full text-base border-collapse">{children}</table>
              </div>
            ),
            th: ({ children }) => <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 bg-zinc-100 dark:bg-white/5 text-left font-semibold">{children}</th>,
            img: ({ src, alt }) => (
              <GeneratedImage src={src} alt={alt} onZoom={() => setLightboxImage({ src, alt })} />
            ),
            td: ({ children }) => <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">{children}</td>,
            code({ inline, className, children, ...props }) {
              return inline ? (
                <code className="bg-zinc-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-[0.85em]" {...props}>{children}</code>
              ) : (
                <CodeBlock className={className}>{children}</CodeBlock>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={toggleSpeak}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-purple-500 transition-all duration-200 hover:scale-105 active:scale-95 px-2 py-1 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10"
        >
          {speaking ? <VolumeX size={15} className="animate-pulse" /> : <Volume2 size={15} />}
          {speaking ? 'Stop' : 'Listen'}
        </button>

        {content && content.length > 100 && (
          <button
            onClick={downloadAsImage}
            disabled={downloading}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-purple-500 transition-all duration-200 hover:scale-105 active:scale-95 px-2 py-1 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10"
          >
            {downloading ? <Loader2 size={15} className="animate-spin" /> : <ImageDown size={15} />}
            {downloading ? 'Generating...' : 'Download as Image'}
          </button>
        )}
      </div>

      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}

export default React.memo(Message);