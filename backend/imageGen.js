const ACCOUNTS = [
  { id: process.env.CF_ACCOUNT_ID_1, token: process.env.CF_API_TOKEN_1 },
  { id: process.env.CF_ACCOUNT_ID_2, token: process.env.CF_API_TOKEN_2 },
  { id: process.env.CF_ACCOUNT_ID_3, token: process.env.CF_API_TOKEN_3 },
  { id: process.env.CF_ACCOUNT_ID_4, token: process.env.CF_API_TOKEN_4 },
].filter((a) => a.id && a.token);

let cfIdx = 0;

const SHARP =
  'ultra sharp, razor-sharp focus, 8k UHD, highly detailed, natural skin texture, ' +
  'shot on Sony A7IV 85mm f/1.8, professional color grading, realistic lighting, no blur';

const NEGATIVE =
  'blur, motion blur, out of focus, lowres, jpeg artifacts, extra fingers, extra limbs, ' +
  'deformed face, watermark, text, logo, cartoon, 3d render, oversaturated';

function translateHinglish(raw) {
  let t = ' ' + (raw || '').trim() + ' ';
  const map = [
    [/chal raha ho|chal rha ho|chal raha hai|paidal|legs se chal|pair se/gi, ' walking on foot on a road '],
    [/bike nahi|bike nhi|or nhi bike|bina bike|not on bike/gi, ' not riding a motorcycle or bike or scooter '],
    [/phone use|mobile use|phone dekh|phone krte/gi, ' looking at a smartphone in their hand '],
    [/banda|aadmi|insaan/gi, ' a man '],
    [/ladki|aurat/gi, ' a woman '],
    [/road pr|road pe|sarak/gi, ' on an Indian street road '],
    [/accha banao|acha banao|hd banao|clear banao/gi, ' enhance quality, sharper, better lighting '],
  ];
  map.forEach(function (pair) {
    t = t.replace(pair[0], pair[1]);
  });
  return t.replace(/\s+/g, ' ').trim();
}

function wantsWalking(text) {
  return /walk|paidal|legs se|pair se|chal r/i.test(text || '');
}

function wantsNoVehicle(text) {
  return /bike nahi|bike nhi|not on bike|bina bike|no motorcycle|no bike|paidal|walk/i.test(text || '');
}

function enhancePrompt(userPrompt) {
  const original = (userPrompt || '').trim();
  const translated = translateHinglish(original);
  let extra = '';
  if (wantsWalking(original) || wantsNoVehicle(original)) {
    extra =
      ' The person is WALKING ON FOOT. Both feet on the ground. ' +
      'NO motorcycle, NO bike, NO scooter, NO helmet unless asked, NO riding. ';
  }
  return (
    'Photorealistic photograph. Follow EVERY detail exactly. Do not add extra objects. ' +
    extra +
    'Scene: ' + translated +
    '. Original request: ' + original +
    '. ' + SHARP
  );
}

function enhanceEditPrompt(userPrompt) {
  const p = (userPrompt || '').trim();
  const lower = p.toLowerCase();
  const wantsEnhance =
    !p ||
    /accha|acha|better|improve|enhance|hd|quality|clear|fix|sudhar|upscale|retouch|sharp/.test(lower);

  if (wantsEnhance) {
    return (
      'Same person, same pose, same background. Photorealistic enhancement only. ' +
      'Sharper details, cleaner skin, better lighting, higher dynamic range, ' +
      'professional DSLR look, keep identity 100%. ' +
      (p ? 'User request: ' + p + '. ' : '') +
      SHARP
    );
  }

  return (
    'Edit this real photo as requested. Keep the same person unless asked to change. ' +
    'Request: ' + p + '. ' + SHARP
  );
}

function editStrength(userPrompt) {
  const p = (userPrompt || '').toLowerCase();
  if (!p || /accha|acha|better|improve|enhance|hd|quality|clear|sharp|fix/.test(p)) return 0.32;
  if (/cartoon|anime|ghibli|oil paint|sketch/.test(p)) return 0.72;
  return 0.48;
}

async function parseCfImageResponse(res) {
  const contentType = (res.headers.get('content-type') || '').toLowerCase();

  if (contentType.includes('application/json')) {
    const json = await res.json();
    const base64 = (json.result && json.result.image) || json.image;
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('No base64 image in Cloudflare response');
    }
    return { buffer: Buffer.from(base64, 'base64'), contentType: 'image/jpeg' };
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (!buffer.length) throw new Error('Empty image response');
  const type = contentType.includes('png') ? 'image/png' : 'image/jpeg';
  return { buffer, contentType: type };
}

async function runOnAccounts(path, body) {
  if (ACCOUNTS.length === 0) throw new Error('No Cloudflare accounts configured');

  let lastError;
  for (let i = 0; i < ACCOUNTS.length; i++) {
    const acc = ACCOUNTS[cfIdx % ACCOUNTS.length];
    cfIdx++;
    try {
      console.log('Trying Cloudflare account ' + (i + 1) + ' for ' + path);
      const res = await fetch(
        'https://api.cloudflare.com/client/v4/accounts/' + acc.id + '/ai/run/' + path,
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + acc.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err.errors && err.errors[0] && err.errors[0].message) || ('HTTP ' + res.status));
      }

      const out = await parseCfImageResponse(res);
      console.log('Image generated successfully!');
      return out;
    } catch (err) {
      console.error('Account ' + (i + 1) + ' failed:', err.message);
      lastError = err;
    }
  }
  throw lastError || new Error('All accounts failed');
}

async function generateImageBuffer(prompt, image) {
  if (image && image.data) {
    const raw = String(image.data).replace(/^data:[^;]+;base64,/, '');
    let negative = NEGATIVE;
    if (wantsNoVehicle(prompt) || wantsWalking(prompt)) {
      negative += ', motorcycle, bike, scooter, helmet visor, riding a vehicle';
    }
    return runOnAccounts('@cf/runwayml/stable-diffusion-v1-5-img2img', {
      prompt: enhanceEditPrompt(prompt),
      negative_prompt: negative,
      image_b64: raw,
      strength: editStrength(prompt),
      num_steps: 20,
      guidance: 8,
    });
  }

  let fluxPrompt = enhancePrompt(prompt);
  if (wantsNoVehicle(prompt) || wantsWalking(prompt)) {
    fluxPrompt += ' Absolutely no motorcycle, no bike, no scooter.';
  }

  return runOnAccounts('@cf/black-forest-labs/flux-1-schnell', {
    prompt: fluxPrompt,
    steps: 8,
  });
}

module.exports = { generateImageBuffer };
