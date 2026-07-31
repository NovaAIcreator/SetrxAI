// groq.js
// Groq API — behtar model (openai/gpt-oss-120b) ke saath

const Groq = require('groq-sdk');

async function callGroq(apiKey, messages, onChunk) {
  const groq = new Groq({ apiKey });

  const stream = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b', // 120B parameter model, behtar reasoning ke liye
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    stream: true,
    temperature: 0.7,
  });

  let fullText = '';
  for await (const chunk of stream) {
    const textPiece = chunk.choices[0]?.delta?.content || '';
    if (textPiece) {
      fullText += textPiece;
      if (onChunk) onChunk(textPiece);
    }
  }
  return { content: fullText };
}

module.exports = { callGroq };