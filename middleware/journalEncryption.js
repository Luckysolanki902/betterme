// middleware/journalEncryption.js
const { encryptData, decryptData, encryptFields, decryptFields } = require('../utils/encryption');

// Define which fields in journal entries should be encrypted
const JOURNAL_ENCRYPTED_FIELDS = ['title', 'content'];

/**
 * Gets the user ID from the request for use in encryption/decryption
 * @param {object} req - Request object
 * @returns {string} User ID, JWT token, or default ID
 */
function getUserId(req) {
  // Try to get userId from cookie
  const { userId } = req.cookies || {};
  
  if (userId) return userId;
  
  // Try to get JWT token from cookie or authorization header
  const token = req.cookies?.sessionId || 
                req.headers?.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      // Try to decode the JWT to get userId
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      return decoded.id || decoded.userId || decoded.sub || 'anonymous-user';
    } catch (err) {
      console.log('Error decoding JWT token:', err.message);
    }
  }
  
  // Get client IP for anonymous users to separate their data
  const clientIp = req.headers['x-forwarded-for'] || 
                  req.connection.remoteAddress || 
                  'anonymous';
  
  // If all else fails, use a default ID
  return `anonymous-user-${clientIp}`;
}

/**
 * Encrypts a journal entry object
 * @param {object} entry - Journal entry object to encrypt
 * @param {string} userId - User ID for key derivation
 * @returns {object} Encrypted journal entry
 */
function encryptJournalEntry(entry, userId) {
  if (!entry) return entry;
  
  // Create a deep copy to avoid modifying the original
  const encryptedEntry = { ...entry };
    // Encrypt the title directly
  if (encryptedEntry.title) {
    encryptedEntry.title = encryptData(encryptedEntry.title, userId);
  }
  
  // Handle Lexical editor content - encrypt the entire editorState JSON string
  if (encryptedEntry.content && encryptedEntry.content.editorState) {
    encryptedEntry.content = {
      ...encryptedEntry.content,
      editorState: encryptData(encryptedEntry.content.editorState, userId)
    };
  }
  
  return encryptedEntry;
}

/**
 * Decrypts a journal entry object
 * @param {object} entry - Encrypted journal entry object
 * @param {string} userId - User ID for key derivation
 * @returns {object} Decrypted journal entry
 */
function decryptJournalEntry(entry, userId) {
  if (!entry) return entry;
  
  // Convert MongoDB document to plain object if needed
  const entryObj = typeof entry.toObject === 'function' 
    ? entry.toObject() 
    : { ...(typeof entry === 'object' ? entry : {}) };
    // Decrypt the title
  if (entryObj.title) {
    entryObj.title = decryptData(entryObj.title, userId);
  }
  
  // Decrypt Lexical editor content
  if (entryObj.content && entryObj.content.editorState) {
    entryObj.content = {
      ...entryObj.content,
      editorState: decryptData(entryObj.content.editorState, userId)
    };
  }
  
  return entryObj;
}

/**
 * Decrypts an array of journal entries
 * @param {Array} entries - Array of encrypted journal entries
 * @param {string} userId - User ID for key derivation
 * @returns {Array} Decrypted journal entries
 */
function decryptJournalEntries(entries, userId) {
  if (!Array.isArray(entries)) return [];
  return entries.map(entry => decryptJournalEntry(entry, userId));
}

module.exports = {
  getUserId,
  encryptJournalEntry,
  decryptJournalEntry,
  decryptJournalEntries,
  JOURNAL_ENCRYPTED_FIELDS
};
