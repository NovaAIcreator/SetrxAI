// imageStore.js
// Generated images ko temporarily memory mein store karta hai — isse bada
// base64 chat message mein nahi bhejna padta (jo corrupt ho sakta tha),
// bajaye iske ek chhoti si URL milti hai jisse browser image load karta hai

const crypto = require('crypto');

const store = new Map();
const TTL_MS = 60 * 60 * 1000; // 1 ghanta tak image available rahegi

function saveImage(buffer, contentType) {
  const id = crypto.randomBytes(12).toString('hex');
  store.set(id, { buffer, contentType, expiresAt: Date.now() + TTL_MS });
  return id;
}

function getImage(id) {
  const entry = store.get(id);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(id);
    return null;
  }
  return entry;
}

// Har 15 min mein expired images automatically clean ho jaayengi
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of store.entries()) {
    if (entry.expiresAt < now) store.delete(id);
  }
}, 15 * 60 * 1000);

module.exports = { saveImage, getImage };