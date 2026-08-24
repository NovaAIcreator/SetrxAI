// UserMenu.jsx — FULL REPLACE (no emoji)
import { useState, useRef, useEffect } from 'react';
import { Info, LogOut } from 'lucide-react';

export default function UserMenu({ user, onLogout, onAboutClick, onLoginClick, onProfileClick }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onAboutClick}
          className="p-2 rounded-full bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300"
          title="About"
        >
          <Info size={16} />
        </button>
        <button
          onClick={onLoginClick}
          className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
        >
          Log In
        </button>
      </div>
    );
  }

  const initial = user?.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 flex items-center justify-center text-sm font-semibold"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-40">
          <button
            onClick={() => {
              onProfileClick();
              setOpen(false);
            }}
            className="w-full text-left px-4 py-3 border-b border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5"
          >
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">View Profile</p>
          </button>
          <button
            onClick={() => {
              onAboutClick();
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2"
          >
            <Info size={14} /> About SetrxAI
          </button>
          <button
            onClick={() => {
              onLogout();
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      )}
    </div>
  );
}
