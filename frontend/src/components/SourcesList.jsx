import { useState } from 'react';
import { Plus, Minus, ExternalLink, Link2 } from 'lucide-react';

export default function SourcesList({ sources, checks }) {
  const [open, setOpen] = useState(false);
  const list = Array.isArray(sources) ? sources.filter((s) => s && (s.url || s.title)) : [];
  if (!list.length && !checks?.length) return null;

  const count = list.length;

  return (
    <div className="mt-3 flex flex-col items-start">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          'group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-all duration-300 ' +
          (open
            ? 'border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-300 shadow-sm'
            : 'border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 text-zinc-500 hover:border-zinc-300 dark:hover:border-white/20 hover:text-zinc-800 dark:hover:text-zinc-200')
        }
        aria-expanded={open}
      >
        <span
          className={
            'flex h-4 w-4 items-center justify-center rounded-full transition-transform duration-300 ' +
            (open ? 'rotate-0 bg-sky-500/20' : 'bg-zinc-200/80 dark:bg-zinc-700/80')
          }
        >
          {open ? <Minus size={11} strokeWidth={2.5} /> : <Plus size={11} strokeWidth={2.5} />}
        </span>
        <Link2 size={12} className="opacity-70" />
        <span className="font-medium tabular-nums">
          {count ? count + (count === 1 ? ' source' : ' sources') : 'Sources'}
        </span>
      </button>

      <div
        className={
          'w-full max-w-md overflow-hidden transition-all duration-300 ease-out ' +
          (open ? 'max-h-[480px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0')
        }
      >
        <div
          className={
            'rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm shadow-lg shadow-zinc-900/5 dark:shadow-black/30 p-3 ' +
            (open ? 'animate-[srcIn_0.28s_ease-out]' : '')
          }
        >
          {checks?.length ? (
            <p className="text-[11px] text-zinc-500 mb-2 px-0.5">
              {checks[checks.length - 1]?.note}
            </p>
          ) : null}

          <ul className="space-y-1">
            {list.map((s, i) => (
              <li
                key={(s.url || s.title || i) + '-' + i}
                style={{ animationDelay: open ? i * 40 + 'ms' : '0ms' }}
                className={open ? 'animate-[srcRow_0.3s_ease-out_both]' : ''}
              >
                <a
                  href={s.url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-zinc-100/80 dark:hover:bg-white/5"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[11px] font-semibold">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-100 group-hover:text-sky-500 line-clamp-1">
                        {s.title || 'Source'}
                      </span>
                      <ExternalLink
                        size={12}
                        className="shrink-0 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </span>
                    {s.url ? (
                      <span className="block truncate text-[11px] text-zinc-500">
                        {String(s.url).replace(/^https?:\/\//, '')}
                      </span>
                    ) : null}
                    {s.snippet ? (
                      <span className="mt-0.5 block text-[12px] leading-snug text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {s.snippet}
                      </span>
                    ) : null}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style>{`
        @keyframes srcIn {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes srcRow {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
