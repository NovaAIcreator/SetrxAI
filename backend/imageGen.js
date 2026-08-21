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
      console.log(`Trying Cloudflare account ${cfIdx}...`);
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${acc.id}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${acc.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt, num_steps: 8 }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.errors?.[0]?.message || `HTTP ${res.status}`);
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      console.log('Image generated successfully!');
      return { buffer, contentType: 'image/jpeg' };
    } catch (err) {
      console.error(`Account ${i + 1} failed:`, err.message);
      lastError = err;
    }
  }
  throw lastError || new Error('All accounts failed');
}

module.exports = { generateImageBuffer };
