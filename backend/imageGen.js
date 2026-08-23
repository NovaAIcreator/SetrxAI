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

function enhancePrompt(userPrompt) {
  const p = (userPrompt || '').trim();
  return (
    'Photorealistic image. Show ONLY what is asked. ' +
    'Do not add people, faces, or extra objects unless the user asked for them. ' +
    'Subject: ' + p +
    '. Sharp focus, natural lighting, high detail, clean composition.'
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
      'Improve this photo: sharper details, better lighting, cleaner quality. ' +
      'Keep the SAME subject, pose, and background. Do not add new people or objects. ' +
      (p ? 'Extra request: ' + p : '')
    );
  }
  return 'Edit this photo as requested. Keep the main subject unless asked to change it. Request: ' + p;
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
      throw new Error('No image in response: ' + JSON.stringify(json).slice(0, 200));
    }
    const clean = base64.replace(/^data:image\/\w+;base64,/, '');
    return { buffer: Buffer.from(clean, 'base64'), contentType: 'image/jpeg' };
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (!buffer.length) throw new Error('Empty image response');
  const type = contentType.includes('png') ? 'image/png' : 'image/jpeg';
  return { buffer, contentType: type };
}

async function runFlux2(prompt, imageBuffer, retries) {
  if (ACCOUNTS.length === 0) throw new Error('No Cloudflare accounts configured');

  let lastError;
  const maxRetries = retries == null ? 2 : retries;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      console.log('Retry ' + attempt + '...');
      await sleep(2000 * attempt);
    }

    for (let i = 0; i < ACCOUNTS.length; i++) {
      const acc = ACCOUNTS[cfIdx % ACCOUNTS.length];
      cfIdx++;
      try {
        console.log('Trying account ' + (i + 1) + ' flux-2-dev...');

        const form = new FormData();
        form.append('prompt', prompt);
        form.append('steps', '20');
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
          'https://api.cloudflare.com/client/v4/accounts/' + acc.id + '/ai/run/@cf/black-forest-labs/flux-2-dev',
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
        console.log('Image generated successfully (flux-2-dev)!');
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
  // Photo edit
  if (image && image.data) {
    const raw = String(image.data).replace(/^data:[^;]+;base64,/, '');
    const imgBuf = Buffer.from(raw, 'base64');
    try {
      return await runFlux2(enhanceEditPrompt(prompt), imgBuf, 3);
    } catch (err) {
      if (isCapacityError(err.message)) {
        throw new Error('Image edit busy hai — 30–60 sec baad try karo.');
      }
      throw err;
    }
  }

  // Normal generate
  return runFlux2(enhancePrompt(prompt), null, 2);
}

module.exports = { generateImageBuffer };
