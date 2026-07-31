export default function ModeSelector({ mode, setMode, theme, toggleTheme, onMenuClick }) {
  const modes = [
    { id: 'general', label: '💬', text: 'General' },
    { id: 'study', label: '📚', text: 'Study' },
    { id: 'coding', label: '💻', text: 'Coding' },
  ];

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4 border-b border-zinc-300/50 dark:border-purple-500/10">
      <button onClick={onMenuClick} className="md:hidden text-xl px-1 text-zinc-700 dark:text-zinc-300">☰</button>

      <div className="flex gap-2 overflow-x-auto flex-1">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200
              ${mode === m.id
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                : 'bg-zinc-200/70 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-white/10'}`}
          >
            <span>{m.label}</span> {m.text}
          </button>
        ))}
      </div>

      <button
        onClick={toggleTheme}
        className="text-lg px-2.5 py-1.5 rounded-full bg-zinc-200/70 dark:bg-white/5 hover:bg-zinc-300 dark:hover:bg-white/10 transition-colors shrink-0"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  );
}