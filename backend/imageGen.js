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

// Hinglish → clear English (van = vehicle, not forest)
function translateHinglish(raw) {
  let t = ' ' + (raw || '').trim() + ' ';

  const map = [
    [/\bvan\b/gi, ' cargo van vehicle '],
    [/\bvans\b/gi, ' cargo van vehicles '],
    [/gaadi|gadi|car\b/gi, ' car '],
    [/bike|motorcycle|pulser|pulsar/gi, ' motorcycle '],
    [/scooty|scooter/gi, ' scooter '],
    [/banda|aadmi|insaan|person|man\b/gi, ' a man '],
    [/ladki|aurat|woman|girl/gi, ' a woman '],
    [/banao|bana do|bana dena|generate|draw|create/gi, ' '],
    [/ek\s+/gi, ' one '],
    [/ki\s+/gi, ' '],
    [/ka\s+/gi, ' '],
    [/colour|color/gi, ' color '],
    [/red color|red colour/gi, ' red colored '],
    [/road pe|road pr|sarak/gi, ' on a road '],
    [/empty|khali|bina banda|no person|without person/gi, ' empty, no people inside or outside '],
    [/chal raha|chal rha|walking|paidal/gi, ' walking on foot '],
    [/phone|mobile/gi, ' smartphone '],
  ];

  map.forEach(function (pair) {
    t = t.replace(pair[0], pair[1]);
  });

  return t.replace(/\s+/g, ' ').trim();
}

function enhancePrompt(userPrompt) {
  const original = (userPrompt || '').trim();
  const translated = translateHinglish(original);

  return (
    'Photorealistic photograph of: ' + translated + '. ' +
    'Show ONLY this subject. Do not add unrelated objects. ' +
    'If it is a vehicle, show the vehicle clearly, not a forest or landscape. ' +
    'Sharp focus, natural lighting, high detail. ' +
    'Original request: ' + original
  );
}

function enhanceEditPrompt(userPrompt) {
  const p = (userPrompt || '').trim();
  const lower = p.toLowerCase();
  const wantsEnhance =
    !p ||
    /accha|acha|better|improve|enhance|hd|quality|clear|fix|sudhar|upscale|retouch|sharp|or aacha|aur accha/.test(lower);

  if (wantsEnhance) {
    return (
      'Improve this photo: sharper, better lighting, cleaner quality. ' +
      'Keep the SAME subject and background. Do not add new people or objects. ' +
      (p ? 'Request: ' + translateHinglish(p) : '')
    );
  }
  return 'Edit this photo. Request: ' + translateHinglish(p) + '. Keep main subject unless asked to change.';
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

// flux-2-klein-9b = fast + good quality (\~8–15 sec)
async function runFluxKlein(prompt, imageBuffer, retries) {
  if (ACCOUNTS.length === 0) throw new Error('No Cloudflare accounts configured');

  let lastError;
  const maxRetries = retries == null ? 1 : retries;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      console.log('Retry ' + attempt + '...');
      await sleep(1500 * attempt);
    }

    for (let i = 0; i < ACCOUNTS.length; i++) {
      const acc = ACCOUNTS[cfIdx % ACCOUNTS.length];
      cfIdx++;
      try {
        console.log('Trying account ' + (i + 1) + ' flux-2-klein-9b...');

        const form = new FormData();
        form.append('prompt', prompt);
        form.append('width', '1024');
        form.append('height', '1024');
        // klein-9b: steps fixed at 4, mat bhejo

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
        console.log('Image OK (flux-2-klein-9b)');
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
  if (image && image.data) {
    const raw = String(image.data).replace(/^data:[^;]+;base64,/, '');
    const imgBuf = Buffer.from(raw, 'base64');
    try {
      return await runFluxKlein(enhanceEditPrompt(prompt), imgBuf, 2);
    } catch (err) {
      if (isCapacityError(err.message)) {
        throw new Error('Image edit busy — 20–30 sec baad try karo.');
      }
      throw err;
    }
  }

  return runFluxKlein(enhancePrompt(prompt), null, 1);
}

module.exports = { generateImageBuffer };
