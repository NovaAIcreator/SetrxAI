// keyManager.js
// Har provider (Groq, Gemini, OpenRouter) ke liye multiple keys manage karta hai
// Agar ek key fail/cooldown ho jaye, to automatically next key use hoti hai

class KeyManager {
  constructor(providerName, keysString) {
    this.providerName = providerName;

    // .env se keys comma-separated string ke roop mein aayengi
    const rawKeys = (keysString || '').split(',').map(k => k.trim()).filter(Boolean);

    this.keys = rawKeys.map((key, index) => ({
      key,
      id: index,
      cooldownUntil: 0, // timestamp jab tak ye key cooldown mein rahegi
    }));

    this.currentIndex = 0;
  }

  // Ek available (non-cooldown) key return karta hai
  getAvailableKey() {
    const now = Date.now();

    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentIndex + i) % this.keys.length;
      const entry = this.keys[idx];

      if (entry.cooldownUntil <= now) {
        this.currentIndex = (idx + 1) % this.keys.length;
        return entry;
      }
    }

    return null; // sabhi keys cooldown mein hain
  }

  // Key ko cooldown mein daalna (jab API error de: rate limit / invalid key)
  markCooldown(keyEntry, durationMs = 60000) {
    keyEntry.cooldownUntil = Date.now() + durationMs;
    console.warn(`[${this.providerName}] Key #${keyEntry.id} ${durationMs}ms ke liye cooldown mein gayi`);
  }

  // Check karta hai ki sabhi keys cooldown mein hai ya nahi
  allKeysOnCooldown() {
    const now = Date.now();
    return this.keys.length === 0 || this.keys.every(k => k.cooldownUntil > now);
  }
}

module.exports = KeyManager;