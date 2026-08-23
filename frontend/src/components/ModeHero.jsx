// ModeHero.jsx — clean open screen (English only)

const SUGGESTIONS = {
  general: [
    { title: 'Explain simply', text: 'Explain quantum computing in simple terms' },
    { title: 'Plan my day', text: 'Create a productive daily routine for a student' },
    { title: 'Write better', text: 'Turn this idea into a short professional post: learning with AI' },
    { title: 'Compare options', text: 'React vs Next.js for beginners — compare in a table' },
  ],
  study: [
    { title: 'Chapter notes', text: 'Make complete exam notes on photosynthesis' },
    { title: 'Practice questions', text: 'Important questions and answers on light for class 10' },
    { title: 'Quick revision', text: 'Short revision sheet for Newton laws with examples' },
    { title: 'Clear a doubt', text: 'Explain Ohm law with a real-life example' },
  ],
  coding: [
    { title: 'Build a page', text: 'Full React + Tailwind landing page code, ready to paste' },
    { title: 'Fix a bug', text: 'Why does useEffect loop forever and how do I fix it?' },
    { title: 'API route', text: 'Complete Express JWT login API with file paths' },
    { title: 'Explain code', text: 'async/await vs Promises with a simple example' },
  ],
};

export default function ModeHero({ mode, onSelect }) {
  const list = SUGGESTIONS[mode] || SUGGESTIONS.general;

  return (
    <div className="flex flex-col items-center justify-center w-full pt-8 sm:pt-14 pb-4 px-2">
      <h1 className="text-[1.75rem] sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 text-center">
        Hi, I&apos;m SetrxAI
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-sm">
        Ask anything. I&apos;ll answer clearly.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {list.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => onSelect && onSelect(item.text)}
            className="text-left rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] px-3.5 py-3 hover:bg-zinc-50 dark:hover:bg-white/[0.06] transition-colors"
          >
            <div className="text-[13px] font-medium text-zinc-800 dark:text-zinc-100">{item.title}</div>
            <div className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-snug">
              {item.text}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
