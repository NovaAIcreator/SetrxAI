const axios = require('axios');

async function searchWeb(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error('TAVILY_API_KEY missing');

  const q = String(query || '').trim();
  if (!q) return null;

  const response = await axios.post(
    'https://api.tavily.com/search',
    {
      api_key: apiKey,
      query: q,
      max_results: 5,
      search_depth: 'advanced',
      include_answer: false,
    },
    { timeout: 20000 }
  );

  const results = response.data?.results || [];
  if (!results.length) return null;

  const sources = results.map((r) => ({
    title: r.title || 'Source',
    url: r.url || '',
    snippet: String(r.content || '').slice(0, 220),
  }));

  const context = sources
    .map(function (s, i) {
      return '[' + (i + 1) + '] ' + s.title + '\n' + s.url + '\n' + s.snippet;
    })
    .join('\n\n');

  return { sources, context };
}

module.exports = { searchWeb };
