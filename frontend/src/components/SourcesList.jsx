import { ExternalLink } from 'lucide-react';

export default function SourcesList({ sources, checks }) {
  if (!sources?.length && !checks?.length) return null;

  return (
    <div className="mt-3 space-y-2">
      {checks?.length ? (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {checks[checks.length - 1]?.note}
        </p>
      ) : null}

      {sources?.length ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Sources
          </p>
          <ul className="space-y-1.5">
            {sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-2.5 rounded-xl px-0 py-1.5 text-sm transition hover:opacity-90"
                >
                  <ExternalLink
                    size={14}
                    className="mt-0.5 shrink-0 text-zinc-400 group-hover:text-sky-400"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-zinc-800 dark:text-zinc-100 group-hover:text-sky-400">
                      {s.title}
                    </span>
                    <span className="block truncate text-[11px] text-zinc-500">
                      {s.url.replace(/^https?:\/\//, '')}
                    </span>
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
      ) : null}
    </div>
  );
}
