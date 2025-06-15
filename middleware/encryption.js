// middleware/encryption.js
const { encryptFields, decryptFields, encryptArray, decryptArray, ENCRYPTED_FIELDS } = require('@/utils/encryption');

/**
 * Get user ID from request (from authentication)
 * @param {object} req - Express request object
 * @returns {string} - User ID or empty string
 */
function getUserId(req) {
  // Try to get user ID from various sources
  if (req.auth?.userId) return req.auth.userId;
  if (req.user?.id) return req.user.id;
  if (req.userId) return req.userId;
  
  // Extract from JWT token if present
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return decoded.sub || decoded.userId || decoded.id || '';
    } catch (error) {
      console.warn('Failed to extract user ID from token:', error);
    }
  }
  
  // Fallback to session or IP-based identifier
  return req.ip || 'anonymous';
}

/**
 * Middleware to encrypt todos before saving to database
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function
 */
function encryptTodoData(req, res, next) {
  try {
    if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
      const userId = getUserId(req);
      req.body = encryptFields(req.body, ENCRYPTED_FIELDS.TODO, userId);
    }
    next();
  } catch (error) {
    console.error('Todo encryption error:', error);
    res.status(500).json({ message: 'Encryption error', error: error.message });
  }
}

/**
 * Middleware to decrypt todos after fetching from database
 * @param {object} data - Data to decrypt
 * @param {string} userId - User ID for decryption
 * @returns {object} - Decrypted data
 */
function decryptTodoData(data, userId) {
  try {
    if (Array.isArray(data)) {
      return decryptArray(data, ENCRYPTED_FIELDS.TODO, userId);
    } else if (data && typeof data === 'object') {
      return decryptFields(data, ENCRYPTED_FIELDS.TODO, userId);
    }
    return data;
  } catch (error) {
    console.error('Todo decryption error:', error);
    return data; // Return original data if decryption fails
  }
}

/**
 * Middleware to encrypt planner data before saving
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function
 */
function encryptPlannerData(req, res, next) {
  try {
    if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
      const userId = getUserId(req);
      req.body = encryptFields(req.body, ENCRYPTED_FIELDS.PLANNER, userId);
    }
    next();
  } catch (error) {
    console.error('Planner encryption error:', error);
    res.status(500).json({ message: 'Encryption error', error: error.message });
  }
}

/**
 * Middleware to decrypt planner data after fetching
 * @param {object} data - Data to decrypt
 * @param {string} userId - User ID for decryption
 * @returns {object} - Decrypted data
 */
function decryptPlannerData(data, userId) {
  try {
    if (Array.isArray(data)) {
      return decryptArray(data, ENCRYPTED_FIELDS.PLANNER, userId);
    } else if (data && typeof data === 'object') {
      return decryptFields(data, ENCRYPTED_FIELDS.PLANNER, userId);
    }
    return data;
  } catch (error) {
    console.error('Planner decryption error:', error);
    return data; // Return original data if decryption fails
  }
}

/**
 * Middleware to encrypt user preferences/settings
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function
 */
function encryptUserData(req, res, next) {
  try {
    if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
      const userId = getUserId(req);
      req.body = encryptFields(req.body, ENCRYPTED_FIELDS.USER_DATA, userId);
    }
    next();
  } catch (error) {
    console.error('User data encryption error:', error);
    res.status(500).json({ message: 'Encryption error', error: error.message });
  }
}

/**
 * Middleware to decrypt user preferences/settings
 * @param {object} data - Data to decrypt
 * @param {string} userId - User ID for decryption
 * @returns {object} - Decrypted data
 */
function decryptUserData(data, userId) {
  try {
    if (Array.isArray(data)) {
      return decryptArray(data, ENCRYPTED_FIELDS.USER_DATA, userId);
    } else if (data && typeof data === 'object') {
      return decryptFields(data, ENCRYPTED_FIELDS.USER_DATA, userId);
    }
    return data;
  } catch (error) {
    console.error('User data decryption error:', error);
    return data; // Return original data if decryption fails
  }
}

module.exports = {
  getUserId,
  encryptTodoData,
  decryptTodoData,
  encryptPlannerData,
  decryptPlannerData,
  encryptUserData,
  decryptUserData
};
