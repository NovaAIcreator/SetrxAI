// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FILE LOCATION: frontend/src/components/SEOHead.jsx
//    (Ye file NEW create karni hai — existing kuch nahi chhega)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Helmet } from 'react-helmet-async';

// ──────────────────────────────────────────────────────
// 🔧 YAHAN APNA DOMAIN DAALO
//
// Abhi development mein hai:
//   const SITE_URL = "http://localhost:5173";
//
// Jab deploy karo (Vercel/Netlify/etc):
//   const SITE_URL = "https://setrxai.com";  ← apna domain
// ──────────────────────────────────────────────────────
const SITE_URL = 'https://setrxai.onrender.com';

// ── Har mode ke liye alag SEO data ──
const seoConfig = {
  study: {
    title: 'SetrxAI Study Assistant – Free AI Tutor for Students | Homework & Exam Help',
    description:
      'SetrxAI Study Assistant is your free AI-powered Teacher. Get instant help with homework, exam prep, science, math, history and more. Study smarter with AI.',
    keywords:
      'AI study assistant, AI tutor, study help AI, AI homework helper, free AI tutor, SetrxAI study, exam preparation AI, AI for students, online AI tutor India',
    url: `${SITE_URL}/study`,
    schema: {
      '@type': 'WebApplication',
      name: 'SetrxAI Study Assistant',
      applicationCategory: 'EducationalApplication',
      description: 'AI-powered study assistant that helps students with homework, exam prep, and learning.',
    },
  },

  coding: {
    title: 'SetrxAI Coding Assistant – Free AI Code Helper | Debug & Write Code with AI',
    description:
      'SetrxAI Coding Assistant helps you write, debug, and understand code in Python, JavaScript, HTML, CSS, Java, C++ and more. Your free AI programmer.',
    keywords:
      'AI coding assistant, AI code helper, free AI programmer, debug code AI, Python AI helper, JavaScript AI, SetrxAI coding, code review AI, AI for developers',
    url: `${SITE_URL}/coding`,
    schema: {
      '@type': 'WebApplication',
      name: 'SetrxAI Coding Assistant',
      applicationCategory: 'DeveloperApplication',
      description: 'AI-powered coding assistant for writing, debugging, and explaining code in all programming languages.',
    },
  },

  general: {
    title: 'SetrxAI – Free AI Chatbot | Ask Anything, Get Instant Answers',
    description:
      'SetrxAI is a free AI chatbot for everyday conversations, advice, creative writing, travel, fitness, cooking and any question you have. Chat with AI now.',
    keywords:
      'free AI chatbot, AI assistant, AI general chat, SetrxAI chat, best free AI chatbot, AI conversation, AI helper online, ask AI anything',
    url: `${SITE_URL}/general`,
    schema: {
      '@type': 'WebApplication',
      name: 'SetrxAI General Chat',
      applicationCategory: 'LifestyleApplication',
      description: 'Free AI chatbot for everyday questions, creative writing, advice and general conversations.',
    },
  },
};

export default function SEOHead({ mode }) {
  // mode jo nahi mila to 'general' use hoga
  const seo = seoConfig[mode] || seoConfig.general;

  const structuredData = {
    '@context': 'https://schema.org',
    ...seo.schema,
    url: seo.url,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isAccessibleForFree: true,
  };

  return (
    <Helmet>
      {/* ── Basic SEO ── */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />
      <meta name="author" content="SetrxAI" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={seo.url} />

      {/* ── Open Graph (WhatsApp/Facebook share) ── */}
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={seo.url} />
      <meta property="og:site_name" content="SetrxAI" />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />

      {/* ── Schema.org Structured Data (Google ke liye) ── */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
  }

