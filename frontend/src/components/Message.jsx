import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import html2canvas from 'html2canvas';
import { Copy, Check, Volume2, VolumeX, ImageDown, Loader2, X, Download } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';

function CodeBlock({ className, children }) {
  const [copied, setCopied] = useState(false);
  const codeText = String(children).replace(/\n$/, '');
  return (
    <div className="relative my-4 group">
      <button
        onClick={() => {
          navigator.clipboard.writeText(codeText);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute top-2 right-2 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-zinc-300 opacity-0 group-hover:opacity-100 z-10"
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
  return (
    <div className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <button
        onClick={async (e) => {
          e.stopPropagation();
          const blob = await (await fetch(src)).blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'setrxai-' + Date.now() + '.png';
          a.click();
          URL.revokeObjectURL(url);
        }}
        className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm"
      >
        <Download size={18} /> Download
      </button>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"
      >
        <X size={22} />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full rounded-xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function GeneratedImage({ src, alt, onZoom }) {
  return (
    <div className="relative inline-block group/img my-3">
      <img
        src={src}
        alt={alt}
        onClick={onZoom}
        className="rounded-xl max-w-full sm:max-w-md shadow-lg cursor-zoom-in"
      />
      <button
        onClick={async (e) => {
          e.stopPropagation();
          const blob = await (await fetch(src)).blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'setrxai-' + Date.now() + '.png';
          a.click();
          URL.revokeObjectURL(url);
        }}
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100"
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

  if (isUser) {
    return (
      <div className="flex justify-end mb-5 px-2 sm:px-4">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-md px-4 py-2.5 text-base leading-relaxed bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md whitespace-pre-wrap">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-7 px-2 sm:px-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium tracking-wide text-zinc-500">SetrxAI</span>
      </div>

      <div
        ref={bubbleRef}
        className="max-w-full md:max-w-3xl text-base sm:text-lg leading-relaxed text-zinc-800 dark:text-zinc-200"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            h2: ({ children }) => (
              <h2 className="text-xl sm:text-2xl font-bold mt-5 mb-2 first:mt-0 text-zinc-900 dark:text-white">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg sm:text-xl font-semibold mt-4 mb-2 first:mt-0">{children}</h3>
            ),
            p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
            strong: ({ children }) => (
              <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{children}</strong>
            ),
            ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1.5">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5">{children}</ol>,
            li: ({ children }) => <li className="pl-0.5">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-white/5 pl-3 py-2 my-3 rounded-r-lg text-base">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-3">
                <table className="w-full text-sm border-collapse">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-zinc-300 dark:border-zinc-700 px-2 py-1.5 bg-zinc-100 dark:bg-white/5 text-left font-semibold">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-zinc-300 dark:border-zinc-700 px-2 py-1.5">{children}</td>
            ),
            img: ({ src, alt }) => (
              <GeneratedImage src={src} alt={alt} onZoom={() => setLightboxImage({ src, alt })} />
            ),
            code({ inline, className, children, ...props }) {
              return inline ? (
                <code
                  className="bg-zinc-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-[0.85em]"
                  {...props}
                >
                  {children}
                </code>
              ) : (
                <CodeBlock className={className}>{children}</CodeBlock>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={() => {
            if (speaking) {
              window.speechSynthesis.cancel();
              setSpeaking(false);
              return;
            }
            const u = new SpeechSynthesisUtterance(content.replace(/[#*`_>\-\[\]]/g, ' '));
            u.onend = () => setSpeaking(false);
            window.speechSynthesis.speak(u);
            setSpeaking(true);
          }}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          {speaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
          {speaking ? 'Stop' : 'Listen'}
        </button>
        {content && content.length > 100 && (
          <button
            onClick={async () => {
              if (!bubbleRef.current) return;
              setDownloading(true);
              try {
                const canvas = await html2canvas(bubbleRef.current, {
                  backgroundColor: document.documentElement.classList.contains('dark')
                    ? '#0a0a12'
                    : '#ffffff',
                  scale: 2,
                });
                const a = document.createElement('a');
                a.download = 'setrxai-notes-' + Date.now() + '.png';
                a.href = canvas.toDataURL('image/png');
                a.click();
              } finally {
                setDownloading(false);
              }
            }}
            disabled={downloading}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <ImageDown size={14} />}
            {downloading ? '...' : 'Save image'}
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
