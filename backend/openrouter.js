// openrouter.js
// OpenRouter — auto-router (openrouter/free) use karta hai, taaki individual
// free models rotate/deprecate hone pe kabhi 404 na aaye

const axios = require('axios');

async function callOpenRouter(apiKey, messages, onChunk) {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'openrouter/free', // auto-router — hamesha kisi available free model ko route karta hai
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      responseType: 'stream',
    }
  );

  return new Promise((resolve, reject) => {
    let fullText = '';

    response.data.on('data', (chunkBuffer) => {
      const lines = chunkBuffer
        .toString()
        .split('\n')
        .filter(line => line.trim().startsWith('data:'));

      for (const line of lines) {
        const data = line.replace('data: ', '').trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const text = parsed.choices[0]?.delta?.content || '';
          if (text) {
            fullText += text;
            if (onChunk) onChunk(text);
          }
        } catch (e) { /* incomplete chunk */ }
      }
    });

    response.data.on('end', () => resolve({ content: fullText }));
    response.data.on('error', (err) => {
      err.status = err.response?.status;
      reject(err);
    });
  });
}

module.exports = { callOpenRouter };