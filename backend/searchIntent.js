// searchIntent.js
// Study/chapter queries + live/current queries — dono pe search trigger hoti hai,
// taaki AI apni purani training memory ki jagah fresh, current content use kare.

const axios = require('axios');

const SEARCH_INTENT_KEYWORDS = [
  // Live/current info
  'current pm', 'current president', 'current ceo', 'current cm', 'abhi ke pm',
  'abhi kaun hai', 'who is the current', 'kaun hai abhi', 'right now',
  'live score', 'match score', 'aaj ka match', 'today\'s match', 'live match',
  'latest news', 'aaj ki news', 'breaking news', 'today\'s news', 'kal ki news',
  'weather today', 'aaj ka mausam', 'mausam kaisa', 'today\'s weather',
  'stock price', 'share price', 'exchange rate', 'aaj ka rate', 'today\'s price',
  'petrol price', 'gold price', 'aaj ka gold rate',
  'this year', 'is saal', '2026 mein kya', 'abhi 2026', 'currently happening',
  'ho raha hai abhi', 'abhi chal raha hai', 'election result', 'election winner',

  // Study/chapter/notes — taaki current syllabus/chapter content mile, purani training memory na use ho
  'chapter', 'class ', 'notes', 'syllabus', 'ncert', 'previous year paper',
  'question paper', 'exam', 'important questions', 'summary', 'revision',
  'batao', 'samjhao', 'explain',
];

async function detectSearchIntent(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return SEARCH_INTENT_KEYWORDS.some((k) => lower.includes(k));
}

async function searchWeb(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error('TAVILY_API_KEY set nahi hai — search skip ho rahi hai');

  const response = await axios.post(
    'https://api.tavily.com/search',
    {
      api_key: apiKey,
      query,
      max_results: 4,
      search_depth: 'basic',
    },
    { timeout: 15000 }
  );

  const results = response.data?.results || [];
  if (results.length === 0) return null;

  const formatted = results
    .map((r, i) => `[${i + 1}] ${r.title}: ${r.content?.slice(0, 300) || ''}`)
    .join('\n\n');

  return formatted;
}

module.exports = { detectSearchIntent, searchWeb };