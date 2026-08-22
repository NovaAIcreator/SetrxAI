const ACCOUNTS = [
  { id: process.env.CF_ACCOUNT_ID_1, token: process.env.CF_API_TOKEN_1 },
  { id: process.env.CF_ACCOUNT_ID_2, token: process.env.CF_API_TOKEN_2 },
  { id: process.env.CF_ACCOUNT_ID_3, token: process.env.CF_API_TOKEN_3 },
  { id: process.env.CF_ACCOUNT_ID_4, token: process.env.CF_API_TOKEN_4 },
].filter((a) => a.id && a.token);

let cfIdx = 0;

async function generateImageBuffer(prompt) {
  if (ACCOUNTS.length === 0) throw new Error('No Cloudflare accounts configured');

  let lastError;
  for (let i = 0; i < ACCOUNTS.length; i++) {
    const acc = ACCOUNTS[cfIdx % ACCOUNTS.length];
    cfIdx++;
    try {
      console.log('Trying Cloudflare account ' + (i + 1) + '...');
      const res = await fetch(
        'https://api.cloudflare.com/client/v4/accounts/' + acc.id + '/ai/run/@cf/black-forest-labs/flux-1-schnell',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + acc.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err.errors && err.errors[0] && err.errors[0].message) || ('HTTP ' + res.status));
      }

      // Cloudflare Flux returns JSON: { result: { image: "<base64>" } }
      const json = await res.json();
      const base64 = (json.result && json.result.image) || json.image;
      if (!base64 || typeof base64 !== 'string') {
        throw new Error('No base64 image in Cloudflare response');
      }

      const buffer = Buffer.from(base64, 'base64');
      console.log('Image generated successfully!');
      return { buffer, contentType: 'image/jpeg' };
    } catch (err) {
      console.error('Account ' + (i + 1) + ' failed:', err.message);
      lastError = err;
    }
  }
  throw lastError || new Error('All accounts failed');
}

module.exports = { generateImageBuffer };
