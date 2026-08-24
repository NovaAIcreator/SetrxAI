// ModeSelector.jsx — FULL REPLACE
import { Menu } from 'lucide-react';

export default function ModeSelector({ onMenuClick }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 sm:px-4 border-b border-zinc-200 dark:border-white/10 md:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        className="p-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Chats</span>
    </div>
  );
}
