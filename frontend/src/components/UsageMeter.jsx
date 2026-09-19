import { useEffect, useState } from "react";

const EMPTY = {
  search: { remaining: 8, limit: 8 },
  image: { remaining: 8, limit: 8 },
};

export function useUsage() {
  const [usage, setUsage] = useState(EMPTY);

  async function refresh() {
    try {
      const res = await fetch("/api/usage");
      if (!res.ok) return;
      const data = await res.json();
      if (data?.search && data?.image) setUsage(data);
    } catch {}
  }

  useEffect(() => {
    void refresh();
  }, []);

  return { usage, refresh, setUsage };
}

export function UsageMeter({ image }) {
  return (
    <div className="border-t border-border px-3 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">Limits</p>
      <p className="mt-1.5 text-xs text-muted">Search on for every question</p>
      <p className="text-xs tabular-nums text-muted">
        Images left {image.remaining}/{image.limit} today
      </p>
    </div>
  );
}
