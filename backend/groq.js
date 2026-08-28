const Groq = require('groq-sdk');

async function callGroq(apiKey, messages, onChunk, _imageData, options = {}) {
  const groq = new Groq({ apiKey });

  const stream = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    stream: true,
    temperature: options.temperature ?? 0.28,
    max_tokens: options.max_tokens ?? 2200,
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
