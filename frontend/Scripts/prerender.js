// frontend/scripts/prerender.js
// Ye script build ke baad 3 alag HTML files banata hai
// Har file mein alag title/description hoga Google ke liye

const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '../dist');
const base = fs.readFileSync(path.join(dist, 'index.html'), 'utf-8');

const routes = {
  study: {
    title: 'SetrxAI Study Assistant – Free AI Tutor for Students',
    desc:  'Free AI study assistant for homework, exam prep, math, science. Study smarter with SetrxAI.',
  },
  coding: {
    title: 'SetrxAI Coding Assistant – Write & Debug Code with AI',
    desc:  'Write, debug and understand code in Python, JavaScript, Java and more. Free AI coding assistant.',
  },
  general: {
    title: 'SetrxAI – Free AI Chatbot | Ask Anything, Get Instant Answers',
    desc:  'Free AI chatbot for travel, advice, creative writing, fitness and everyday questions.',
  },
};

for (const [route, seo] of Object.entries(routes)) {
  const dir = path.join(dist, route);
  fs.mkdirSync(dir, { recursive: true });

  const html = base
    .replace(/<title>.*?<\/title>/,
      `<title>${seo.title}</title>`)
    .replace('</head>',
      `<meta name="description" content="${seo.desc}">
  <meta property="og:title" content="${seo.title}">
  <meta property="og:description" content="${seo.desc}">
  <meta name="robots" content="index, follow">
</head>`);

  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log('Created: dist/' + route + '/index.html');
}

console.log('Prerender done!');
