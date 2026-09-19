import { ExternalLink } from "lucide-react";

export default function SourcesList({ sources, checks }) {
  if (!sources?.length && !checks?.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {checks?.length ? (
        <p className="font-mono text-[11px] text-subtle">
          Scout ran {checks.length} checks · last: {checks[checks.length - 1].note}
        </p>
      ) : null}
      {sources?.length ? (
        <ul className="space-y-1.5">
          {sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" className="group flex items-start gap-2 rounded-[var(--radius-sm)] border border-border bg-bg px-2.5 py-2 text-sm hover:border-primary">
                <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-subtle" />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-fg group-hover:text-primary">{s.title}</span>
                  <span className="block truncate font-mono text-[11px] text-subtle">{s.url}</span>
                  {s.snippet ? <span className="mt-0.5 block line-clamp-2 text-xs text-muted">{s.snippet}</span> : null}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
