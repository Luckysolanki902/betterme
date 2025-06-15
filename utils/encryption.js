// utils/encryption.js
const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits for CBC
const SALT_LENGTH = 32; // 256 bits
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Derives an encryption key from the JWT secret and optional salt
 * @param {string} salt - Optional salt for key derivation
 * @returns {Buffer} - Derived key
 */
function deriveKey(salt = '') {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) {
    throw new Error('JWT_SECRET_KEY is not configured');
  }
  
  const saltBuffer = Buffer.from(salt || 'default-salt', 'utf8');
  return crypto.pbkdf2Sync(secret, saltBuffer, ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypts sensitive data with AES-256-CBC
 * @param {string|object} data - Data to encrypt
 * @param {string} userId - User ID for key derivation (optional)
 * @returns {string} - Encrypted data as base64 string
 */
function encryptData(data, userId = '') {
  try {
    // Convert data to string if it's an object
    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Generate random salt and IV for each encryption
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key using salt and user ID
    const key = deriveKey(salt.toString('hex') + userId);
    
    // Create cipher using the modern API
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt data
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine salt + iv + encrypted data
    const result = salt.toString('hex') + ':' + iv.toString('hex') + ':' + encrypted;

    return Buffer.from(result).toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}
    


/**
 * Decrypts data encrypted with encryptData
 * @param {string} encryptedData - Base64 encrypted data
 * @param {string} userId - User ID for key derivation (optional)
 * @returns {string|object} - Decrypted data
 */
function decryptData(encryptedData, userId = '') {
  try {
    // Handle null, undefined, or non-string values
    if (!encryptedData || typeof encryptedData !== 'string') {
      console.warn('Attempted to decrypt invalid data:', encryptedData);
      return typeof encryptedData === 'string' ? encryptedData : '';
    }
    
    // Check if the data looks like it's encrypted (has our format)
    // This helps with backward compatibility with unencrypted data
    if (!encryptedData.includes(':') && !encryptedData.match(/^[A-Za-z0-9+/=]+$/)) {
      // If it doesn't look like base64 or our format, it's likely plain text
      return encryptedData;
    }
    
    // Try to convert from base64 and split components
    let buffer;
    try {
      buffer = Buffer.from(encryptedData, 'base64').toString();
    } catch (err) {
      console.warn('Failed to decode base64 data:', err);
      return encryptedData; // Return original if not base64
    }
    
    const [saltHex, ivHex, encrypted] = buffer.split(':');
    
    if (!saltHex || !ivHex || !encrypted) {
      console.warn('Invalid encrypted data format, returning original');
      return encryptedData;
    }
    
    try {
      // Convert hex strings back to buffers
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      
      // Derive key using salt and user ID
      const key = deriveKey(salt.toString('hex') + userId);
      
      // Create decipher using the modern API
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      
      // Decrypt data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Try to parse as JSON, return as string if it fails
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      console.error('Decryption process error:', error);
      // Return a fallback value rather than throwing
      return encryptedData;
    }
  } catch (error) {
    console.error('Top-level decryption error:', error);
    // Return the original data instead of throwing
    return encryptedData;
  }
}

/**
 * Encrypts specific fields in an object
 * @param {object} obj - Object to encrypt
 * @param {string[]} fields - Fields to encrypt
 * @param {string} userId - User ID for key derivation
 * @returns {object} - Object with encrypted fields
 */
function encryptFields(obj, fields, userId = '') {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const result = { ...obj };
  
  fields.forEach(field => {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = encryptData(result[field], userId);
    }
  });
  
  return result;
}

/**
 * Decrypts specific fields in an object
 * @param {object} obj - Object to decrypt
 * @param {string[]} fields - Fields to decrypt
 * @param {string} userId - User ID for key derivation
 * @returns {object} - Object with decrypted fields
 */
function decryptFields(obj, fields, userId = '') {
  // Return early for invalid objects
  if (!obj) {
    return {};
  }
  
  // Handle MongoDB documents or plain objects
  const result = typeof obj.toObject === 'function' 
    ? obj.toObject() 
    : { ...(typeof obj === 'object' ? obj : {}) };
  
  // Skip if result is not an object at this point
  if (typeof result !== 'object') {
    return result;
  }
  
  // Ensure fields is an array
  const fieldsToDecrypt = Array.isArray(fields) ? fields : [];
  
  // Process each field for decryption
  fieldsToDecrypt.forEach(field => {
    if (result[field] !== undefined && result[field] !== null) {
      try {
        const decrypted = decryptData(result[field], userId);
        
        // Verify decrypted data looks valid before using it
        if (decrypted !== null && decrypted !== undefined) {
          // For fields that should be strings, ensure they're strings
          if (['title', 'description', 'category', 'content', 'notes'].includes(field) && 
              typeof decrypted !== 'string') {
            result[field] = String(decrypted);
          } else {
            result[field] = decrypted;
          }
        } else {
          console.warn(`Decryption returned null/undefined for field ${field}, using fallback`);
          result[field] = getFallbackValue(field, result[field]);
        }
      } catch (error) {
        console.warn(`Failed to decrypt field ${field}:`, error);
        // Use fallback value if decryption fails
        result[field] = getFallbackValue(field, result[field]);
      }
    }
  });
  
  return result;
}

/**
 * Get a fallback value for a field when decryption fails
 * @param {string} field - Field name
 * @param {any} originalValue - The original value that failed decryption
 * @returns {string} - Fallback value
 */
function getFallbackValue(field, originalValue) {
  // If the original value is a string that doesn't look base64 encoded, just return it
  if (typeof originalValue === 'string' && 
      !originalValue.match(/^[A-Za-z0-9+/=]+$/) && 
      !originalValue.includes(':')) {
    return originalValue;
  }
  
  switch (field) {
    case 'title':
      return '[Task Title]';
    case 'description':
      return '';
    case 'category':
      return 'general';
    case 'content':
      return '';
    case 'notes':
      return '';
    case 'preferences':
    case 'settings':
      return {};    case 'personalData':
      return { name: 'User' };
    default:
      return '';
  }
}

/**
 * Encrypts an array of objects
 * @param {object[]} array - Array of objects to encrypt
 * @param {string[]} fields - Fields to encrypt in each object
 * @param {string} userId - User ID for key derivation
 * @returns {object[]} - Array with encrypted objects
 */
function encryptArray(array, fields, userId = '') {
  if (!Array.isArray(array)) {
    return array;
  }
  
  return array.map(item => encryptFields(item, fields, userId));
}

/**
 * Decrypts an array of objects
 * @param {object[]} array - Array of objects to decrypt
 * @param {string[]} fields - Fields to decrypt in each object
 * @param {string} userId - User ID for key derivation
 * @returns {object[]} - Array with decrypted objects
 */
function decryptArray(array, fields, userId = '') {
  // Handle non-array input
  if (!array) {
    return [];
  }
  
  if (!Array.isArray(array)) {
    try {
      // Try to convert to array if it's an array-like object (e.g., MongoDB result)
      return decryptArray(Array.from(array), fields, userId);
    } catch (error) {
      console.error('Failed to convert to array:', error);
      return [];
    }
  }
  
  // Filter out any invalid items before mapping
  return array
    .filter(item => item !== null && item !== undefined)
    .map(item => {
      try {
        return decryptFields(item, fields, userId);
      } catch (error) {
        console.error('Failed to decrypt item in array:', error);
        // Return the item unmodified if decryption fails
        return item;
      }
    });
}

/**
 * Hash sensitive data for indexing/searching (one-way)
 * @param {string} data - Data to hash
 * @param {string} userId - User ID for salt
 * @returns {string} - Hashed data
 */
function hashData(data, userId = '') {
  const salt = process.env.JWT_SECRET_KEY + userId;
  return crypto.createHmac('sha256', salt).update(data).digest('hex');
}

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes
 * @returns {string} - Random token as hex string
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Define constants for field definitions
const ENCRYPTED_FIELDS = {
  TODO: ['title', 'description', 'category'],
  PLANNER: ['title', 'description', 'content', 'notes'],
  USER_DATA: ['preferences', 'settings', 'personalData']
};

// Export all functions and constants
module.exports = {
  encryptData,
  decryptData,
  encryptFields,
  decryptFields,
  encryptArray,
  decryptArray,
  hashData,
  generateToken,
  ENCRYPTED_FIELDS
};
