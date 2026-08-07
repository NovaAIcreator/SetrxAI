// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 GENERAL PAGE — SetrxAI
// File location: frontend/src/pages/General.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import ChatPage from "../components/ChatPage";

const generalConfig = {
  // Page mode
  mode: "general",

  // ── AI ka welcome message ──
  welcomeMessage:
    "Hello! I am 🌟 SetrxAI — Your all-in-one AI Assistant!\n\nI will help in:\n✈️ Travel recommendations & trip planning\n✍️ Creative writing, stories & poems\n🥗 Recipes, meal plans & fitness advice\n💰 Finance, business & life tips\n🎬 Movie, book & music suggestions\n💬 And evrything Whatever is on your mind!
  // ── Navbar badge ─
  badge: "🌐 General AI Chat",

  // ── Hero section ──
  heroTitle: "Ask Anything —",
  heroHighlight: "SetrxAI Knows It All",
  heroDesc:
    "From travel tips to life advice, creative writing to health questions — SetrxAI is your free AI companion for everyday conversations.",

  // ── AI avatar ──
  aiAvatar: "🌟",

  // ── Input placeholder ──
  placeholder: "Ask anything — travel, food, advice, fun facts...",

  // ── Quick topic chips ──
  topics: [
    { label: "✈️ Travel Planning", prompt: "Plan a 7-day trip to Japan for me with budget tips" },
    { label: "✍️ Creative Writing", prompt: "Write me a short motivational story in Hindi" },
    { label: "🥗 Meal Plan", prompt: "Give me a healthy meal plan for weight loss — 7 days" },
    { label: "🎯 Success Habits", prompt: "What are the best daily habits for success?" },
    { label: "📈 Stock Market", prompt: "Explain how the stock market works in simple words" },
    { label: "💪 Workout Plan", prompt: "Give me a 30-day home workout plan without equipment" },
    { label: "🤯 Random Fact", prompt: "Tell me an interesting fact I probably don't know" },
    { label: "😴 Better Sleep", prompt: "How can I improve my sleep quality naturally?" },
  ],

  // ── SEO section ──
  seo: {
    heading: "SetrxAI — Your All-In-One Free AI Assistant",
    para: "SetrxAI General Chat is perfect for people who want a smart, friendly AI for anything. No limits, no subscriptions — pure AI intelligence, 24 hours a day.",
    features: [
      { title: "✈️ Travel AI", desc: "Personalized trip plans, hotel tips, packing lists and guides." },
      { title: "✍️ Creative AI", desc: "Stories, poems, essays, captions — creative content in seconds." },
      { title: "🥗 Health & Fitness", desc: "Meal plans, workout routines, nutrition advice and wellness tips." },
      { title: "💬 Life Advice", desc: "Career guidance, productivity tips, relationship advice and more." },
    ],
  },

  // ── Color theme (Amber/Orange) ──
  colors: {
    bg: "#0f0f13",
    surface: "#18181f",
    accent: "#f59e0b",
    accent2: "#fbbf24",
    border: "#2a2a35",
    userBubble: "#1f1e2e",
    aiBubble: "#17171f",
  },
};

export default function General() {
  return <ChatPage config={generalConfig} />;
  }
  
