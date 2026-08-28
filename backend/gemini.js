const { GoogleGenerativeAI } = require('@google/generative-ai');

async function callGemini(apiKey, messages, onChunk, imageData, options = {}) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: options.temperature ?? 0.28,
      maxOutputTokens: options.max_tokens ?? 900,
    },
  });

  const systemMsg = messages.find((m) => m.role === 'system');
  const otherMsgs = messages.filter((m) => m.role !== 'system');

  const history = otherMsgs.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const lastMessage = otherMsgs[otherMsgs.length - 1]?.content || '';

  const chat = model.startChat({
    history,
    systemInstruction: systemMsg
      ? { role: 'system', parts: [{ text: systemMsg.content }] }
      : undefined,
  });

  const imgs = Array.isArray(imageData) ? imageData : imageData ? [imageData] : [];
  let messageParts;
  if (imgs.length > 0) {
    messageParts = [{ text: lastMessage || 'Please analyze the attached image(s).' }];
    imgs.slice(0, 4).forEach((img) => {
      messageParts.push({
        inlineData: {
          mimeType: img.mimeType || 'image/jpeg',
          data: String(img.data).replace(/^data:[^;]+;base64,/, ''),
        },
      });
    });
  } else {
    messageParts = lastMessage;
  }

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
