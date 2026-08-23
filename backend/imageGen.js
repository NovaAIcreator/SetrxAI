const { GoogleGenerativeAI } = require('@google/generative-ai');

const ACCOUNTS = [
  { id: process.env.CF_ACCOUNT_ID_1, token: process.env.CF_API_TOKEN_1 },
  { id: process.env.CF_ACCOUNT_ID_2, token: process.env.CF_API_TOKEN_2 },
  { id: process.env.CF_ACCOUNT_ID_3, token: process.env.CF_API_TOKEN_3 },
  { id: process.env.CF_ACCOUNT_ID_4, token: process.env.CF_API_TOKEN_4 },
].filter((a) => a.id && a.token);

let cfIdx = 0;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isCapacityError(msg) {
  return /capacity temporarily exceeded|rate limit|429|503/i.test(msg || '');
}

function getGeminiKey() {
  for (let i = 1; i <= 10; i++) {
    const k = process.env['GEMINI_KEYS_' + i];
    if (k && k.trim()) return k.trim();
  }
  return process.env.GEMINI_API_KEY || null;
}

// Gemini = brain — samajhta hai user kya chahta hai
async function smartPrompt(userText, image) {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    return {
      mode: image ? 'edit' : 'generate',
      prompt: (userText || 'high quality image').trim(),
      useReference: !!image,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const system = `You are an expert image director. User may write in Hindi, Hinglish, or English.
Your job: understand EXACTLY what they want and write ONE perfect English prompt for an image model.

Rules:
1. Output ONLY valid JSON, no markdown, no extra text.
2. JSON shape:
{"mode":"generate"|"edit"|"recreate","prompt":"...","useReference":true|false}
3. mode meanings:
- generate = brand new image from text only
- edit = improve/change the attached photo but keep same subject (do not flip/mirror)
- recreate = user showed a reference (logo/design/photo) and wants a NEW better version inspired by it, NOT a copy/flip of the same image
4. prompt must be detailed English, photorealistic when needed, specific about subject.
5. If user says "van" in Hinglish they mean a cargo van vehicle, NOT a forest.
6. If user wants logo/design like the attached image: mode=recreate, useReference=false, write a full logo design prompt describing style/colors/text from the image but as a NEW original design.
7. Never say flip, mirror, or "same photo".
8. Keep prompt under 120 words.`;

    const parts = [];
    parts.push({
      text:
        system +
        '\n\nUser request: ' +
        (userText || '(no text, only image — improve quality)') +
        (image ? '\n\nAn image is attached. Analyze it.' : '\n\nNo image attached.'),
    });

    if (image && image.data) {
      const raw = String(image.data).replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: image.mimeType || 'image/jpeg',
          data: raw,
        },
      });
    }

    const result = await model.generateContent(parts);
    const text = (result.response && result.response.text && result.response.text()) || '';
    const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);

    return {
      mode: parsed.mode || (image ? 'edit' : 'generate'),
      prompt: (parsed.prompt || userText || 'high quality image').trim(),
      useReference: parsed.useReference === true && !!image,
    };
  } catch (err) {
    console.error('smartPrompt failed:', err.message);
    return {
      mode: image ? 'edit' : 'generate',
      prompt: (userText || 'high quality detailed image').trim(),
      useReference: !!image,
    };
  }
}

async function parseResponse(res) {
  const contentType = (res.headers.get('content-type') || '').toLowerCase();

  if (contentType.includes('application/json')) {
    const json = await res.json();
    const base64 =
      (json.result && json.result.image) ||
      json.image ||
      (json.result && typeof json.result === 'string' ? json.result : null);
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('No image in response');
    }
    const clean = base64.replace(/^data:image\/\w+;base64,/, '');
    return { buffer: Buffer.from(clean, 'base64'), contentType: 'image/jpeg' };
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (!buffer.length) throw new Error('Empty image response');
  return {
    buffer,
    contentType: contentType.includes('png') ? 'image/png' : 'image/jpeg',
  };
}

async function runFlux(prompt, imageBuffer, retries) {
  if (ACCOUNTS.length === 0) throw new Error('No Cloudflare accounts configured');

  let lastError;
  const maxRetries = retries == null ? 1 : retries;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) await sleep(1500 * attempt);

    for (let i = 0; i < ACCOUNTS.length; i++) {
      const acc = ACCOUNTS[cfIdx % ACCOUNTS.length];
      cfIdx++;
      try {
        console.log('Flux account ' + (i + 1) + '...');

        const form = new FormData();
        form.append('prompt', prompt);
        form.append('width', '1024');
        form.append('height', '1024');

        if (imageBuffer && imageBuffer.length) {
          form.append(
            'input_image_0',
            new Blob([imageBuffer], { type: 'image/jpeg' }),
            'photo.jpg'
          );
        }

        const res = await fetch(
          'https://api.cloudflare.com/client/v4/accounts/' +
            acc.id +
            '/ai/run/@cf/black-forest-labs/flux-2-klein-9b',
          {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + acc.token },
            body: form,
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err.errors && err.errors[0] && err.errors[0].message) ||
              ('HTTP ' + res.status)
          );
        }

        const out = await parseResponse(res);
        console.log('Image OK | prompt:', prompt.slice(0, 80));
        return out;
      } catch (err) {
        console.error('Account ' + (i + 1) + ' failed:', err.message);
        lastError = err;
      }
    }

    if (!isCapacityError(lastError && lastError.message)) break;
  }

  throw lastError || new Error('All accounts failed');
}

async function generateImageBuffer(prompt, image) {
  // 1) Gemini samajhe — user kya chahta hai
  const plan = await smartPrompt(prompt, image);
  console.log('Image plan:', plan.mode, '| useRef:', plan.useReference);

  let finalPrompt = plan.prompt;

  if (plan.mode === 'edit') {
    finalPrompt =
      'Edit this photo carefully. ' + finalPrompt +
      ' Keep the same subject. Do not flip or mirror. High quality.';
  } else if (plan.mode === 'recreate') {
    finalPrompt =
      'Create a NEW original design. ' + finalPrompt +
      ' Do not copy or flip the reference photo. Professional, clean, high quality.';
  } else {
    finalPrompt =
      'Photorealistic high quality image. ' + finalPrompt +
      ' Show only what is asked. Sharp focus, natural lighting.';
  }

  // 2) Reference image kab use kare
  let imgBuf = null;
  if (image && image.data && (plan.useReference || plan.mode === 'edit')) {
    const raw = String(image.data).replace(/^data:[^;]+;base64,/, '');
    imgBuf = Buffer.from(raw, 'base64');
  }

  // recreate → usually text-only (naya design)
  if (plan.mode === 'recreate') {
    imgBuf = null;
  }

  try {
    return await runFlux(finalPrompt, imgBuf, 1);
  } catch (err) {
    if (isCapacityError(err.message)) {
      throw new Error('Image service busy — 20–30 sec baad try karo.');
    }
    throw err;
  }
}

module.exports = { generateImageBuffer };
