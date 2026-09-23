import { useEffect, useState } from 'react';
import { API_URL, getToken } from '../api';

const EMPTY = {
  search: { remaining: 99, limit: 99 },
  image: { remaining: 8, limit: 8, used: 0 },
};

export function useUsage() {
  const [usage, setUsage] = useState(EMPTY);

  async function refresh() {
    try {
      const token = getToken();
      const res = await fetch(API_URL + '/api/usage', {
        headers: token ? { Authorization: 'Bearer ' + token } : {},
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.image) setUsage(Object.assign({}, EMPTY, data));
    } catch (e) {
      /* keep last */
    }
  }

  useEffect(function () {
    refresh();
  }, []);

  return { usage: usage, refresh: refresh, setUsage: setUsage };
}

export function UsageMeter(props) {
  const image = props.image || {};
  const left = image.remaining != null ? image.remaining : 8;
  const limit = image.limit != null ? image.limit : 8;
  const pct = Math.max(0, Math.min(100, (left / limit) * 100));

  return (
    <div className="px-1 py-1">
      <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur px-3 py-1.5 shadow-sm">
        <span className="text-[11px] text-zinc-500">Images</span>
        <span className="text-[12px] font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
          {left}/{limit}
        </span>
        <span className="relative h-1.5 w-14 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-sky-400 transition-all duration-500 ease-out"
            style={{ width: pct + '%' }}
          />
        </span>
      </div>
    </div>
  );
}
