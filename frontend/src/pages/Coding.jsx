// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💻 CODING PAGE — SetrxAI
// File location: frontend/src/pages/Coding.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import ChatPage from "../components/ChatPage";

const codingConfig = {
  // Page mode
  mode: "coding",

  // ── AI ka welcome message ──
  welcomeMessage:
    "Hey developer! 💻 I am SetrxAI Coding Assistant!\n\nI will help in:\n🐍 Python · ⚡ JavaScript · ☕ Java · 🔵 C++\n⚛️ React · 🗄️ SQL · 🐘 PHP · 🦀 Rust · And more!\n\n🔧 Bug fix | 📝 Clean code | 💡 Understand Concepts \n\nJust paste your code and ask anything about it!",

  // ── Navbar badge ──
  badge: "💻 AI Coding Assistant",

  // ── Hero section ──
  heroTitle: "Write & Debug Code with",
  heroHighlight: "AI Power",
  heroDesc:
    "SetrxAI helps you write clean code, fix bugs, understand algorithms in Python, JavaScript, Java, C++, and 30+ languages.",

  // ── AI avatar ──
  aiAvatar: "💻",

  // ── Input placeholder ──
  placeholder: "Ask any Code or debugging",

  // ── Quick topic chips ──
  topics: [
    { label: "🐍 Python", prompt: "Write a Python function to reverse a string" },
    { label: "⚡ JS Async", prompt: "Explain async/await in JavaScript with example" },
    { label: "⚛️ React", prompt: "How to use useEffect hook in React?" },
    { label: "🗄️ SQL", prompt: "Write a SQL query to find duplicate rows in a table" },
    { label: "📊 Big O", prompt: "Explain Big O notation with simple examples" },
    { label: "🎨 CSS", prompt: "How to center a div in CSS — all methods" },
    { label: "☕ Java", prompt: "Write a binary search algorithm in Java" },
    { label: "🔗 REST API", prompt: "What is a REST API and how to build one in Node.js?" },
  ],

  // ── SEO section ──
  seo: {
    heading: "The Best Free AI Coding Assistant",
    para: "SetrxAI Coding Assistant understands your code problems and gives instant, working solutions. Beginner ho ya senior developer — SetrxAI har cheez me help karta hai.",
    features: [
      { title: "🔧 Bug Fixer", desc: "Error paste karo aur fixed, explained solution pao instantly." },
      { title: "📝 Code Writer", desc: "Describe karo kya chahiye aur clean, ready-to-use code pao." },
      { title: "💡 Code Explainer", desc: "Koi bhi code snippet step-by-step explain hoga." },
      { title: "🏗️ Architecture", desc: "System design, databases aur API structure me advice." },
    ],
  },

  // ── Color theme (Green — GitHub style) ──
  colors: {
    bg: "#0d1117",
    surface: "#161b22",
    accent: "#2ea043",
    accent2: "#56d364",
    border: "#21262d",
    userBubble: "#1a2332",
    aiBubble: "#161c25",
  },
};

export default function Coding() {
  return <ChatPage config={codingConfig} />;
}
