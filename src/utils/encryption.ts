// @ts-nocheck - Ignoring TypeScript issues

// This polyfill is necessary for Web Crypto API to work in the browser

// Browser Compatible Encryption Implementation using Web Crypto API
// Using the built-in Web Crypto API in the browser instead of Node.js crypto module

const KEY_LENGTH = 32; // 256 bits for AES-256
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits for AES-GCM
const PBKDF2_ITERATIONS = 100000; // Recommended iterations

/**
 * Converts String to Uint8Array
 */
const strToUint8Array = (str: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(str);
};

/**
 * Converts Uint8Array to string
 */
const uint8ArrayToStr = (arr: Uint8Array): string => {
  const decoder = new TextDecoder();
  return decoder.decode(arr);
};

/**
 * Browser compatible random value generator
 */
const getRandomValues = (length: number): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(length));
};

/**
 * Base64 encoding and decoding functions
 */
const uint8ArrayToBase64 = (arr: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < arr.byteLength; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return window.btoa(binary);
};

const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Derives a cryptographic key from a password using PBKDF2.
 * @param password The master password.
 * @param salt The salt to use for key derivation.
 * @returns A Promise that resolves with the derived key as a CryptoKey.
 */
export const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const passwordBuffer = strToUint8Array(password);
  
  // Import password as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive actual key using PBKDF2
  // @ts-ignore: Ignoring type incompatibility checks in Web Crypto API calls
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH * 8 },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts data using AES-256-GCM.
 * @param data The data to encrypt (as a string).
 * @param password The encryption password.
 * @returns A Promise that resolves with the encrypted data, salt, and IV as a string (base64 encoded).
 * The format is: salt.iv.encryptedData
 */
export const encryptData = async (data: string, password: string): Promise<string> => {
  const salt = getRandomValues(SALT_LENGTH);
  const iv = getRandomValues(IV_LENGTH);
  const key = await deriveKey(password, salt);

  const encoded = strToUint8Array(data);
  
  // @ts-ignore: Ignoring type incompatibility checks in Web Crypto API calls
  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encoded
  );
  
  // Convert encrypted ArrayBuffer to Uint8Array for consistent handling
  const encryptedData = new Uint8Array(encryptedContent);
  
  // Combine salt, iv, and encrypted data for storage
  return `${uint8ArrayToBase64(salt)}.${uint8ArrayToBase64(iv)}.${uint8ArrayToBase64(encryptedData)}`;
};

/**
 * Decrypts data using AES-256-GCM.
 * @param encryptedDataString The encrypted data string (in the format salt.iv.encryptedData).
 * @param password The master password.
 * @returns A Promise that resolves with the decrypted data as a string, or null if decryption fails.
 */
export const decryptData = async (encryptedDataString: string, password: string): Promise<string | null> => {
  try {
    const parts = encryptedDataString.split('.');
    if (parts.length !== 3) {
      console.error('Invalid encrypted data format');
      return null;
    }

    const salt = base64ToUint8Array(parts[0]);
    const iv = base64ToUint8Array(parts[1]);
    const encryptedData = base64ToUint8Array(parts[2]);
    
    const key = await deriveKey(password, salt);
    
    // @ts-ignore: Ignoring type incompatibility checks in Web Crypto API calls
    const decryptedContent = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedData
    );
    
    return uint8ArrayToStr(new Uint8Array(decryptedContent));
  } catch (error) {
    console.error('Failed to decrypt data', error);
    return null;
  }
};

/**
 * Generate a password based on specified criteria
 * @param length Password length
 * @param includeUppercase Include uppercase letters
 * @param includeLowercase Include lowercase letters
 * @param includeNumbers Include numbers
 * @param includeSymbols Include symbols
 * @returns A randomly generated password
 */
export const generatePassword = (
  length: number = 12,
  includeUppercase: boolean = true,
  includeLowercase: boolean = true,
  includeNumbers: boolean = true,
  includeSymbols: boolean = true
): string => {
  let charset = '';

  if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeNumbers) charset += '0123456789';
  if (includeSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

  if (charset === '') charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let password = '';
  const randomBytes = getRandomValues(length);
  
  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % charset.length;
    password += charset[randomIndex];
  }

  return password;
};

/**
 * Calculate password strength (0-100)
 * @param password The password to evaluate
 * @returns A score from 0-100 based on password complexity
 */
export const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;

  let score = 0;

  // Length check
  score += Math.min(password.length * 4, 40);

  // Character variety checks
  if (/[A-Z]/.test(password)) score += 10;
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^A-Za-z0-9]/.test(password)) score += 10;

  // Additional complexity check
  const uniqueChars = new Set(password.split('')).size;
  score += Math.min(uniqueChars * 2, 20);

  return Math.min(score, 100);
};

/**
 * Hashes a master password using PBKDF2 via Web Crypto API
 * @param password The master password to hash
 * @returns A string containing the salt and hash (salt:hash) both base64 encoded
 */
export const hashMasterPassword = async (password: string): Promise<string> => {
  const salt = getRandomValues(SALT_LENGTH);
  
  // Import password as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    strToUint8Array(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Derive key bits
  // @ts-ignore: Ignoring type incompatibility checks in Web Crypto API calls
  const keyBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-512'
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  
  // Return as salt:hash format
  return `${uint8ArrayToBase64(salt)}:${uint8ArrayToBase64(new Uint8Array(keyBits))}`;
};

/**
 * Verifies a master password against a stored salt and hash
 * @param password The master password to verify
 * @param storedHashString The string containing the salt and hash (salt:hash)
 * @returns True if the password is valid, false otherwise
 */
export const verifyMasterPassword = async (password: string, storedHashString: string): Promise<boolean> => {
  try {
    const [saltBase64, storedHashBase64] = storedHashString.split(':');
    if (!saltBase64 || !storedHashBase64) {
      console.error("Invalid stored hash format.");
      return false;
    }
    
    const salt = base64ToUint8Array(saltBase64);
    
    // Import password as raw key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      strToUint8Array(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    // Derive key bits with same parameters
    // @ts-ignore: Ignoring type incompatibility checks in Web Crypto API calls
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-512'
      },
      keyMaterial,
      KEY_LENGTH * 8
    );
    
    // Compare derived hash with stored hash
    const derivedHashBase64 = uint8ArrayToBase64(new Uint8Array(derivedBits));
    return derivedHashBase64 === storedHashBase64;
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
};
