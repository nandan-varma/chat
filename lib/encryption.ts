/**
 * Encryption utilities for secure message handling
 * Using AES encryption from browser's Web Crypto API
 */

/**
 * Generate a cryptographic key from a password using PBKDF2
 */
export async function generateKeyFromPassword(password: string, salt: string = 'chat-room-salt'): Promise<CryptoKey> {
  // Convert password and salt to array buffers
  const passwordBuffer = new TextEncoder().encode(password);
  const saltBuffer = new TextEncoder().encode(salt);
  
  // Import the password as a key
  const importedKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive a key for AES-GCM
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a string using AES-GCM
 */
export async function encryptMessage(plaintext: string, password: string): Promise<string> {
  try {
    // Generate a random initialization vector
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Generate the encryption key from password
    const key = await generateKeyFromPassword(password);
    
    // Convert plaintext to buffer
    const plaintextBuffer = new TextEncoder().encode(plaintext);
    
    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      plaintextBuffer
    );
    
    // Combine IV and encrypted data for storage
    const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encryptedBuffer), iv.length);
    
    // Return as base64 string for easy storage
    return btoa(String.fromCharCode(...result));
  } catch (error) {
    console.error('Encryption error:', error);
    return plaintext; // Fallback to plaintext on error
  }
}

/**
 * Decrypt a string using AES-GCM
 */
export async function decryptMessage(encryptedText: string, password: string): Promise<string> {
  try {
    // Convert base64 string back to buffer
    const data = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    
    // Extract IV (first 12 bytes) and ciphertext
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);
    
    // Generate the decryption key from password
    const key = await generateKeyFromPassword(password);
    
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      ciphertext
    );
    
    // Convert buffer back to string
    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    return '🔒 Encrypted message (incorrect password)';
  }
}

/**
 * Check if a room requires a password and if it exists in localStorage
 */
export function hasRoomPassword(roomId: string): boolean {
  const key = `room_${roomId}`;
  return localStorage.getItem(key) !== null;
}

/**
 * Get a room's password from localStorage
 */
export function getRoomPassword(roomId: string): string | null {
  const key = `room_${roomId}`;
  return localStorage.getItem(key);
}