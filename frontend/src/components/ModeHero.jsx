// frontend/src/components/ModeHero.jsx — NEW FILE

const config = {
  study: {
    icon: '🎓', title: 'Study Assistant',
    sub: 'Homework, exam prep, science, math — sab kuch',
    color: 'from-violet-500 to-purple-600',
    ring: 'ring-purple-500/30',
    chipColor: 'hover:border-purple-500 hover:text-purple-400',
    chips: [
      { label: '📐 Quadratic Equations', p: 'Explain quadratic equations with examples' },
      { label: '🌿 Photosynthesis', p: 'Explain photosynthesis in simple words' },
      { label: '🌍 World War 2', p: 'Summarize World War 2 in key points' },
      { label: '📝 Exam Tips', p: 'Give me best tips for exam preparation' },
      { label: '⚛️ Quantum Physics', p: 'What is quantum physics in simple words?' },
      { label: '🧬 DNA vs RNA', p: 'Explain the difference between DNA and RNA' },
    ],
  },
  coding: {
    icon: '💻', title: 'Coding Assistant',
    sub: 'Code likho, bugs fix karo, concepts samjho',
    color: 'from-emerald-500 to-green-600',
    ring: 'ring-emerald-500/30',
    chipColor: 'hover:border-emerald-500 hover:text-emerald-400',
    chips: [
      { label: '🐍 Python Function', p: 'Write a Python function to reverse a string' },
      { label: '⚡ JS Async/Await', p: 'Explain async/await in JavaScript with example' },
      { label: '⚛️ React useEffect', p: 'How to use useEffect hook in React?' },
      { label: '🗄️ SQL Query', p: 'Write SQL query to find duplicate rows' },
      { label: '🎨 CSS Center Div', p: 'How to center a div in CSS — all methods' },
      { label: '🔗 REST API', p: 'How to build a REST API in Node.js?' },
    ],
  },
  general: {
    icon: '🌟', title: 'General Assistant',
    sub: 'Travel, recipes, advice, fun facts — kuch bhi poocho',
    color: 'from-amber-500 to-orange-500',
    ring: 'ring-amber-500/30',
    chipColor: 'hover:border-amber-500 hover:text-amber-400',
    chips: [
      { label: '✈️ Japan Trip Plan', p: 'Plan a 7-day trip to Japan with budget tips' },
      { label: '🥗 Weight Loss Meal', p: 'Give me a healthy 7-day meal plan for weight loss' },
      { label: '💪 Home Workout', p: 'Give me a 30-day home workout plan without equipment' },
      { label: '📈 Stock Market', p: 'Explain how the stock market works in simple words' },
      { label: '✍️ Motivational Story', p: 'Write me a short motivational story' },
      { label: '🤯 Random Fact', p: "Tell me an interesting fact I probably don't know" },
    ],
  },
};

export default function ModeHero({ mode, onSelect }) {
  const c = config[mode] || config.general;
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 pb-4 animate-fadeInUp">
      {/* Icon */}
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center text-3xl mb-4 shadow-lg ring-4 ${c.ring}`}>
        {c.icon}
      </div>
      {/* Title */}
      <h2 className={`text-2xl font-bold bg-gradient-to-r ${c.color} bg-clip-text text-transparent mb-1`}>
        SetrxAI {c.title}
      </h2>
      <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 text-center max-w-xs">
        {c.sub}
      </p>
      {/* Chips */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-md">
        {c.chips.map((chip, i) => (
          <button
            key={i}
            onClick={() => onSelect(chip.p)}
            className={`text-left text-xs px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 transition-all duration-200 hover:scale-105 active:scale-95 ${c.chipColor}`}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
  }
