const { GoogleGenerativeAI } = require('@google/generative-ai');

const KEYS = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
  process.env.GEMINI_KEY_4,
  process.env.GEMINI_KEY_5,
  process.env.GEMINI_KEY_6,
  process.env.GEMINI_KEY_7,
  process.env.GEMINI_KEY_8,
  process.env.GEMINI_KEY_9,
  process.env.GEMINI_KEY_10,
  process.env.GEMINI_KEY_11,
  process.env.GEMINI_KEY_12,
  process.env.GEMINI_KEY_13,
  process.env.GEMINI_KEY_14,
  process.env.GEMINI_KEY_15,
  process.env.GEMINI_KEY_16,
  process.env.GEMINI_KEY_17,
  process.env.GEMINI_KEY_18,
  process.env.GEMINI_KEY_19,
  process.env.GEMINI_KEY_20,
].filter(Boolean);

let idx = 0;
function getKey() {
  const key = KEYS[idx % KEYS.length];
  idx++;
  return key;
}

async function generateImageBuffer(prompt) {
  if (KEYS.length === 0) {
    throw new Error('No Gemini API keys configured');
  }

  let lastError;
  for (let attempt = 0; attempt < Math.min(KEYS.length, 3); attempt++) {
    const key = getKey();
    console.log(`Trying key attempt ${attempt + 1}, key starts with: ${key?.substring(0, 8)}`);
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-preview-image-generation',
      });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
        },
      });

      const candidates = result?.response?.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error('No candidates in response');
      }

      const parts = candidates[0]?.content?.parts;
      if (!parts) throw new Error('No parts in response');

      const imgPart = parts.find((p) => p.inlineData);
      if (!imgPart) throw new Error('No image part found');

      const buffer = Buffer.from(imgPart.inlineData.data, 'base64');
      const contentType = imgPart.inlineData.mimeType || 'image/png';
      console.log('Image generated successfully!');
      return { buffer, contentType };
    } catch (err) {
      console.error(`Attempt ${attempt + 1} failed:`, err.message);
      lastError = err;
    }
  }
  throw lastError || new Error('Image generation failed');
}

module.exports = { generateImageBuffer };
