/**
 * Encryption utilities for secure message handling.
 * Uses Web Crypto API (AES-GCM + PBKDF2).
 *
 * Breaking change note: the PBKDF2 salt now includes the roomId, so keys are
 * per-room. Existing messages encrypted with the old fixed salt will not decrypt.
 */

export async function generateKeyFromPassword(password: string, roomId: string): Promise<CryptoKey> {
  const passwordBuffer = new TextEncoder().encode(password)
  const saltBuffer = new TextEncoder().encode(`chats-room-${roomId}`)

  const importedKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBuffer, iterations: 100000, hash: 'SHA-256' },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptMessage(plaintext: string, password: string, roomId: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await generateKeyFromPassword(password, roomId)
  const plaintextBuffer = new TextEncoder().encode(plaintext)

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintextBuffer
  )

  const result = new Uint8Array(iv.length + encryptedBuffer.byteLength)
  result.set(iv)
  result.set(new Uint8Array(encryptedBuffer), iv.length)

  return btoa(String.fromCharCode(...result))
}

export async function decryptMessage(encryptedText: string, password: string, roomId: string): Promise<string> {
  const data = Uint8Array.from(atob(encryptedText), (c) => c.charCodeAt(0))
  const iv = data.slice(0, 12)
  const ciphertext = data.slice(12)
  const key = await generateKeyFromPassword(password, roomId)

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )

  return new TextDecoder().decode(decryptedBuffer)
}

export function hasRoomPassword(roomId: string): boolean {
  return localStorage.getItem(`room_${roomId}`) !== null
}

export function getRoomPassword(roomId: string): string | null {
  return localStorage.getItem(`room_${roomId}`)
}

/**
 * Derives a verification hash from a password using PBKDF2 (100k iterations).
 * Stored in Firebase for room entry verification; much stronger than SHA-256.
 */
export async function createPasswordHash(password: string): Promise<string> {
  const passwordBuffer = new TextEncoder().encode(password)
  const saltBuffer = new TextEncoder().encode('chats-pw-v2')

  const importedKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuffer, iterations: 100000, hash: 'SHA-256' },
    importedKey,
    256
  )

  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPasswordHash(password: string, hash: string): Promise<boolean> {
  const computed = await createPasswordHash(password)
  return computed === hash
}
