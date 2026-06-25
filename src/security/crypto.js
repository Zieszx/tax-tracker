// Pure crypto module — AES-GCM + PBKDF2
// Uses global crypto.subtle (Web Crypto API, available in Node ≥20 + jsdom)

function toBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function fromBase64(str) {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0))
}

/** Returns 16 random bytes as a Uint8Array. */
export function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16))
}

/**
 * Derives an AES-GCM-256 CryptoKey from a passcode + salt using PBKDF2 SHA-256.
 * @param {string} passcode
 * @param {Uint8Array} salt
 * @returns {Promise<CryptoKey>}
 */
export async function deriveKey(passcode, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passcode),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 150_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypts a JSON-serialisable object.
 * @param {any} obj
 * @param {CryptoKey} key
 * @returns {Promise<{iv: string, ciphertext: string}>}
 */
export async function encryptJSON(obj, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = new TextEncoder().encode(JSON.stringify(obj))
  const cipherbuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  return { iv: toBase64(iv), ciphertext: toBase64(cipherbuf) }
}

/**
 * Decrypts an encrypted envelope and parses JSON.
 * Throws on authentication failure.
 * @param {{iv: string, ciphertext: string}} envelope
 * @param {CryptoKey} key
 * @returns {Promise<any>}
 */
export async function decryptJSON({ iv, ciphertext }, key) {
  const ivBuf = fromBase64(iv)
  const cipherbuf = fromBase64(ciphertext)
  const plainbuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuf }, key, cipherbuf)
  return JSON.parse(new TextDecoder().decode(plainbuf))
}
