const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateImageBuffer(prompt) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-preview-image-generation',
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  });

  const parts = result.response.candidates[0].content.parts;
  const imgPart = parts.find((p) => p.inlineData);

  if (!imgPart) throw new Error('Image generate nahi hui');

  const buffer = Buffer.from(imgPart.inlineData.data, 'base64');
  const contentType = imgPart.inlineData.mimeType || 'image/png';

  return { buffer, contentType };
}

module.exports = { generateImageBuffer };
