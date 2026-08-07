// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 STUDY PAGE — SetrxAI
// File location: frontend/src/pages/Study.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import ChatPage from "../components/ChatPage";

const studyConfig = {
  // Page mode (backend ko pata chalega kaunsa page hai)
  mode: "study",

  // ── AI ka welcome message ──
  welcomeMessage:
    "Hi!I am 🎓 SetrxAI Study Assistant!\n\nI will help you in:\n📚 Homework & assignments\n🧮 Math & science problems\n📖 Essays & summaries\n🌍 History, geography, languages\n📝 Exam tips & study strategies",

  // ── Navbar badge ──
  badge: "🎓 AI Study Assistant",

  // ── Hero section ──
  heroTitle: "Your Free",
  heroHighlight: "AI Study Teacher",
  heroDesc:
    "SetrxAI helps students with homework, exam prep, science, math, history, languages — ask anything, get instant answers!",

  // ── AI avatar ──
  aiAvatar: "🎓",

  // ── Input placeholder ──
  placeholder: "Ask any Question about Study!...",

  // ── Quick topic chips ──
  topics: [
    { label: "🌿 Photosynthesis", prompt: "Explain photosynthesis in simple words" },
    { label: "📐 Quadratic Eq.", prompt: "Help me understand quadratic equations with examples" },
    { label: "🌍 World War 2", prompt: "Summarize World War 2 in simple points" },
    { label: "⚙️ Newton's Laws", prompt: "What is Newton's second law of motion?" },
    { label: "💧 Water Cycle", prompt: "Explain the water cycle step by step" },
    { label: "📝 Exam Prep", prompt: "Give me tips for better exam preparation" },
    { label: "⚛️ Quantum Physics", prompt: "What is a photon in quantum physics?" },
    { label: "🧬 DNA vs RNA", prompt: "Explain the difference between DNA and RNA" },
  ],

  // ── SEO section (Google ranking ke liye) ──
  seo: {
    heading: "Why Use SetrxAI for Studying?",
    para: "SetrxAI Study Assistant is one of the best free AI tools for students. Whether preparing for board exams, understanding complex science, or needing help with essays — SetrxAI gives instant, accurate answers 24/7.",
    features: [
      { title: "📐 Math Solver", desc: "Step-by-step solutions for algebra, geometry, calculus and more." },
      { title: "🧪 Science Help", desc: "Physics, chemistry, biology explained in simple language." },
      { title: "📖 Essay Writing", desc: "Outlines, introductions, conclusions and full essays on demand." },
      { title: "🌍 History & GK", desc: "Summaries, timelines and analysis of world events." },
    ],
  },

  // ── Color theme (Purple) ──
  colors: {
    bg: "#0f1117",
    surface: "#1a1d2e",
    accent: "#6c63ff",
    accent2: "#a78bfa",
    border: "#2d3148",
    userBubble: "#2a2d4a",
    aiBubble: "#1e2235",
  },
};

export default function Study() {
  return <ChatPage config={studyConfig} />;
    }
     
