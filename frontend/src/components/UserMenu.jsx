// UserMenu.jsx
// Login hai to avatar+dropdown (Profile/About/Logout), guest hai to "Log In" button

import { useState, useRef, useEffect } from 'react';

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

  // ---- Guest mode: sirf Login button ----
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onAboutClick}
          className="text-lg px-2 py-1.5 rounded-full bg-zinc-200/70 dark:bg-white/5 hover:bg-zinc-300 dark:hover:bg-white/10 transition-colors"
          title="About"
        >
          ℹ️
        </button>
        <button
          onClick={onLoginClick}
          className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md hover:shadow-lg transition-shadow"
        >
          Log In
        </button>
      </div>
    );
  }

  // ---- Logged in: avatar + dropdown ----
  const initial = user?.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold shadow-md hover:scale-105 transition-transform"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-40 animate-fadeInUp">
          <button
            onClick={() => { onProfileClick(); setOpen(false); }}
            className="w-full text-left px-4 py-3 border-b border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
          >
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            <p className="text-[10px] text-purple-500 mt-0.5">View Profile</p>
          </button>
          <button
            onClick={() => { onAboutClick(); setOpen(false); }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
          >
            ℹ️ About SetrxAI
          </button>
          <button
            onClick={() => { onLogout(); setOpen(false); }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            🚪 Log Out
          </button>
        </div>
      )}
    </div>
  );
}