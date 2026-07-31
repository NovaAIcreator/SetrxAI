// gemini.js
// Gemini API — naya 2.5-flash model + image (vision) support

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function callGemini(apiKey, messages, onChunk, imageData) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const systemMsg = messages.find(m => m.role === 'system');
  const otherMsgs = messages.filter(m => m.role !== 'system');

  const history = otherMsgs.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const lastMessage = otherMsgs[otherMsgs.length - 1]?.content || '';

  const chat = model.startChat({
  history,
  systemInstruction: systemMsg
    ? {
        role: "system",
        parts: [{ text: systemMsg.content }]
      }
    : undefined,
});
  const messageParts = imageData
    ? [
        { text: lastMessage },
        { inlineData: { mimeType: imageData.mimeType, data: imageData.data } },
      ]
    : lastMessage;

  const result = await chat.sendMessageStream(messageParts);

  let fullText = '';
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      fullText += text;
      if (onChunk) onChunk(text);
    }
  }

  return { content: fullText };
}

module.exports = { callGemini };