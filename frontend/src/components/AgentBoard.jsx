import { Beaker, PenLine, Radar } from "lucide-react";

const META = {
  scout: { label: "Scout", icon: Radar, tone: "text-scout" },
  lab: { label: "Lab", icon: Beaker, tone: "text-lab" },
  writer: { label: "Writer", icon: PenLine, tone: "text-writer" },
};

export default function AgentBoard({ events, visible }) {
  if (!visible) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {["scout", "lab", "writer"].map((id) => {
        const meta = META[id];
        const ev = events[id];
        const Icon = meta.icon;
        const live = ev.status === "running";
        const log = (ev.log || []).slice(-4);
        return (
          <section key={id} className="rounded-[var(--radius-md)] border border-border bg-surface p-3">
            <div className="flex items-center gap-2">
              <Icon className={`size-4 ${meta.tone}`} strokeWidth={1.75} />
              <h3 className="text-sm font-medium">{meta.label}</h3>
              <span className={"ml-auto font-mono text-[10px] uppercase tracking-wide tabular-nums " + (live ? "text-primary" : "text-subtle")}>
                {ev.status}
              </span>
            </div>
            <p className="mt-2 min-h-10 text-xs leading-snug text-muted">{ev.detail || "Idle"}</p>
            {log.length > 1 ? (
              <ul className="mt-2 space-y-0.5">
                {log.map((line, i) => (
                  <li key={id + i} className="truncate font-mono text-[10px] text-subtle">{line}</li>
                ))}
              </ul>
            ) : null}
            {live ? (
              <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-elevated">
                <div className="h-full w-1/2 animate-pulse bg-primary" />
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
