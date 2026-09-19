export default function ArtifactFrame({ html }) {
  const src = html.includes("<html")
    ? html
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui;margin:16px;background:#f4f1ea;color:#161616}</style></head><body>${html}</body></html>`;
  return (
    <div className="mt-3 overflow-hidden rounded-[var(--radius-md)] border border-border">
      <div className="flex items-center justify-between border-b border-border bg-elevated px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted">Live artifact</span>
        <span className="text-[11px] text-subtle">Runs in this page — no install</span>
      </div>
      <iframe title="Live artifact" sandbox="allow-scripts" srcDoc={src} className="h-[320px] w-full bg-surface" />
    </div>
  );
}
