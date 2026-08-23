// ModeHero.jsx — clean Claude / ChatGPT style empty state

const SUGGESTIONS = {
  general: [
    { title: 'Explain simply', text: 'Quantum computing ko simple Hinglish me samjhao' },
    { title: 'Plan my day', text: 'College student ke liye productive daily routine banao' },
    { title: 'Write better', text: 'Is idea ko professional LinkedIn post bana do: AI se padhai' },
    { title: 'Compare options', text: 'React vs Next.js — beginner ke liye kaunsa better, table me' },
  ],
  study: [
    { title: 'Chapter notes', text: 'Photosynthesis ke complete exam notes banao' },
    { title: 'Important Qs', text: 'Class 10 Light chapter ke important questions with answers' },
    { title: 'Quick revision', text: 'Newton laws ka short revision sheet with examples' },
    { title: 'Doubt clear', text: 'Ohm law confusion clear karo real life example se' },
  ],
  coding: [
    { title: 'Build a site', text: 'Simple React + Tailwind landing page ka pura code do' },
    { title: 'Fix my bug', text: 'React useEffect infinite loop kyun hota hai, example ke sath fix' },
    { title: 'API route', text: 'Express me JWT login API ka complete code with file paths' },
    { title: 'Explain code', text: 'async/await vs Promises — simple example ke sath' },
  ],
};

const TITLES = {
  general: 'How can I help you?',
  study: 'What do you want to study?',
  coding: 'What are you building?',
};

const SUBS = {
  general: 'Ask anything — clear answers, no fluff.',
  study: 'Notes, doubts, revision — exam-ready help.',
  coding: 'Full files, real paths, production-style code.',
};

export default function ModeHero({ mode, onSelect }) {
  const list = SUGGESTIONS[mode] || SUGGESTIONS.general;
  const title = TITLES[mode] || TITLES.general;
  const sub = SUBS[mode] || SUBS.general;

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] px-4 py-10">
      <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center mb-6 shadow-sm">
        <span className="text-xl text-white dark:text-zinc-900">✨</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 text-center mb-2">
        {title}
      </h1>
      <p className="text-sm sm:text-[15px] text-zinc-500 dark:text-zinc-400 text-center max-w-md mb-10">
        {sub}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
        {list.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => onSelect && onSelect(item.text)}
            className="text-left rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-white/[0.06] transition-colors group"
          >
            <div className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 mb-0.5 group-hover:text-zinc-700 dark:group-hover:text-white">
              {item.title}
            </div>
            <div className="text-[12px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-snug">
              {item.text}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
    }
