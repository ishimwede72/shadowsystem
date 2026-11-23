/**
 * Local-only cryptography helpers for the SHADOW SYSTEMS demo.
 *
 * Everything here runs in the browser with the Web Crypto API. Nothing is
 * transmitted, stored or logged. These are genuine primitives used on
 * user-supplied demonstration text only — no target, account or network is
 * ever contacted.
 */

const enc = new TextEncoder()
/** Cast helper: TS 5.9+ types Uint8Array over ArrayBufferLike; WebCrypto wants ArrayBuffer. */
const bs = (u: Uint8Array): BufferSource => u as unknown as BufferSource
const dec = new TextDecoder()

export const isCryptoAvailable = () => typeof globalThis.crypto?.subtle !== 'undefined'

export function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function fromHex(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '')
  const out = new Uint8Array(Math.floor(clean.length / 2))
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return out
}

export function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  arr.forEach((b) => { binary += String.fromCharCode(b) })
  return btoa(binary)
}

export function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64.replace(/\s+/g, ''))
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

export function randomHex(bytes = 16): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return toHex(buf)
}

// ------------------------------------------------------------------ hashing --
export type HashAlgo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

export const HASH_ALGOS: { id: HashAlgo; label: string; bits: number }[] = [
  { id: 'SHA-1', label: 'SHA-1 (legacy)', bits: 160 },
  { id: 'SHA-256', label: 'SHA-256', bits: 256 },
  { id: 'SHA-384', label: 'SHA-384', bits: 384 },
  { id: 'SHA-512', label: 'SHA-512', bits: 512 },
]

export async function digest(algo: HashAlgo, text: string): Promise<string> {
  if (!isCryptoAvailable()) throw new Error('Web Crypto unavailable in this context')
  const buf = await crypto.subtle.digest(algo, enc.encode(text))
  return toHex(buf)
}

export function crc32(input: string): string {
  const bytes = enc.encode(input)
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i]
    for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
  }
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0')
}

export function fnv1a(input: string): string {
  let h = 0x811c9dc5
  const bytes = enc.encode(input)
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i]
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

// --------------------------------------------------------------- AES-GCM -----
export interface AesResult {
  cipher: string
  iv: string
  key: string
  algorithm: string
}

export async function aesEncrypt(plaintext: string, bits: 128 | 192 | 256 = 256, keyHex?: string): Promise<AesResult> {
  if (!isCryptoAvailable()) throw new Error('Web Crypto unavailable in this context')
  const rawKey = keyHex ? fromHex(keyHex) : crypto.getRandomValues(new Uint8Array(bits / 8))
  const key = await crypto.subtle.importKey('raw', bs(rawKey), { name: 'AES-GCM' }, false, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const buf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext))
  return { cipher: toBase64(buf), iv: toHex(iv), key: toHex(rawKey), algorithm: `AES-${bits}-GCM` }
}

export async function aesDecrypt(cipherB64: string, ivHex: string, keyHex: string): Promise<string> {
  if (!isCryptoAvailable()) throw new Error('Web Crypto unavailable in this context')
  const key = await crypto.subtle.importKey('raw', bs(fromHex(keyHex)), { name: 'AES-GCM' }, false, ['decrypt'])
  const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bs(fromHex(ivHex)) }, key, bs(fromBase64(cipherB64)))
  return dec.decode(buf)
}

// ------------------------------------------------------------ key exchange ---
export async function generateEcdh() {
  if (!isCryptoAvailable()) throw new Error('Web Crypto unavailable in this context')
  const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const pub = await crypto.subtle.exportKey('raw', pair.publicKey)
  const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: pair.publicKey }, pair.privateKey, 256)
  return { publicKey: toBase64(pub), sharedSecret: toHex(bits) }
}

// --------------------------------------------------------------- signatures --
export async function ecdsaSign(text: string) {
  if (!isCryptoAvailable()) throw new Error('Web Crypto unavailable in this context')
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, pair.privateKey, enc.encode(text))
  const pub = await crypto.subtle.exportKey('raw', pair.publicKey)
  return { signature: toHex(sig), publicKey: toBase64(pub), fingerprint: toHex(await crypto.subtle.digest('SHA-256', pub)).slice(0, 32) }
}

export async function ecdsaVerify(text: string, signatureHex: string, publicKeyB64: string): Promise<boolean> {
  if (!isCryptoAvailable()) return false
  try {
    const keyBytes = fromBase64(publicKeyB64)
    const key = await crypto.subtle.importKey('raw', bs(keyBytes), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
    return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, bs(fromHex(signatureHex)), enc.encode(text))
  } catch {
    return false
  }
}

// ------------------------------------------------------------- passphrases ---
const WORDS = ['harbor', 'lantern', 'cipher', 'granite', 'atlas', 'vector', 'onyx', 'cobalt', 'ember', 'fathom', 'meridian', 'quartz', 'orchard', 'nimbus', 'kestrel', 'tundra']

export function passphrase(words = 4): string {
  const bytes = crypto.getRandomValues(new Uint8Array(words * 2))
  return Array.from({ length: words }, (_, i) => `${WORDS[bytes[i * 2] % WORDS.length]}${bytes[i * 2 + 1]}`).join('-')
}

export function entropyBits(charsetSize: number, length: number): number {
  return Math.round(length * Math.log2(Math.max(2, charsetSize)))
}

// ------------------------------------------------------- classical ciphers --
export const CAESAR = {
  encrypt(text: string, shift: number): string {
    return text.replace(/[a-zA-Z]/g, (c) => {
      const base = c <= 'Z' ? 65 : 97
      return String.fromCharCode(((c.charCodeAt(0) - base + shift + 26) % 26) + base)
    })
  },
  decrypt(text: string, shift: number): string {
    return CAESAR.encrypt(text, -shift)
  },
}

export function vigenere(text: string, key: string, mode: 'enc' | 'dec' = 'enc'): string {
  const cleanKey = key.replace(/[^a-zA-Z]/g, '').toUpperCase()
  if (!cleanKey) return text
  let k = 0
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97
    const shift = cleanKey.charCodeAt(k % cleanKey.length) - 65
    k += 1
    const d = mode === 'enc' ? shift : -shift
    return String.fromCharCode(((c.charCodeAt(0) - base + d + 26) % 26) + base)
  })
}

export function atbash(text: string): string {
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97
    return String.fromCharCode(base + 25 - (c.charCodeAt(0) - base))
  })
}

export function rot13(text: string): string {
  return CAESAR.encrypt(text, 13)
}

export function xorCipher(text: string, key: string): string {
  if (!key) return text
  const bytes = enc.encode(text)
  const keyBytes = enc.encode(key)
  const out = bytes.map((b, i) => b ^ keyBytes[i % keyBytes.length])
  return toHex(out)
}

export function xorDecipher(hex: string, key: string): string {
  if (!key) return ''
  try {
    const bytes = fromHex(hex)
    const keyBytes = enc.encode(key)
    return dec.decode(bytes.map((b, i) => b ^ keyBytes[i % keyBytes.length]))
  } catch {
    return ''
  }
}

// ------------------------------------------------------------- morse & binary
const MORSE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---',
  K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
  U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---',
  3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
}

export function toMorse(text: string): string {
  return text.toUpperCase().split('').map((c) => (c === ' ' ? '/' : MORSE[c] ?? '')).filter(Boolean).join(' ')
}

export function fromMorse(code: string): string {
  const rev = Object.entries(MORSE).reduce<Record<string, string>>((acc, [k, v]) => { acc[v] = k; return acc }, {})
  return code.trim().split(/\s+/).map((t) => (t === '/' ? ' ' : rev[t] ?? '?')).join('')
}

export function toBinary(text: string): string {
  return Array.from(enc.encode(text)).map((b) => b.toString(2).padStart(8, '0')).join(' ')
}

export function fromBinary(bin: string): string {
  try {
    const bytes = bin.trim().split(/\s+/).map((b) => parseInt(b, 2))
    return dec.decode(new Uint8Array(bytes))
  } catch {
    return ''
  }
}

export function toBase32ish(text: string): string {
  return toBase64(enc.encode(text)).replace(/=+$/, '')
}

export function fromBase32ish(text: string): string {
  try {
    const pad = text.length % 4 === 0 ? '' : '='.repeat(4 - (text.length % 4))
    return dec.decode(fromBase64(text + pad))
  } catch {
    return ''
  }
}
