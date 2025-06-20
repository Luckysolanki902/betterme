// utils/plannerUtils.js
/**
 * Helper functions for handling planner data
 */

/**
 * Process the content passed to the editor to ensure it's in the correct format
 * This function will fix issues with encrypted content
 */
export function processEditorContent(content) {
  // If there's no content
  if (!content) return createEmptyDocument();
  
  // For content with editorState property
  if (content.editorState) {
    try {
      // If editorState is already an object, use it
      if (typeof content.editorState === 'object') {
        // Ensure the object structure is valid for Lexical
        const contentStr = JSON.stringify(content.editorState);
        try {
          validateLexicalState(contentStr); // Will throw if invalid
          return contentStr;
        } catch (e) {
          console.warn('Invalid editorState object, creating empty document:', e);
          return createEmptyDocument();
        }
      }
      
      // If it's a string and seems like JSON, validate and return it
      if (typeof content.editorState === 'string') {
        // Bail early if it's empty
        if (!content.editorState.trim()) {
          return createEmptyDocument();
        }
        
        if (content.editorState.startsWith('{') || content.editorState.startsWith('[')) {
          try {
            validateLexicalState(content.editorState); // Will throw if invalid
            return content.editorState;
          } catch (e) {
            console.warn('Invalid editorState JSON, creating empty document:', e);
            return createEmptyDocument();
          }        } else {
          // If it doesn't seem like JSON, check if it's encrypted
          if (isLikelyEncrypted(content.editorState)) {
            console.warn('Encrypted editorState detected, displaying empty document temporarily');
            // Return special marker to indicate encrypted content
            return JSON.stringify({
              root: {
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "This content appears to be encrypted. Please refresh the page to try again.",
                        type: "text",
                        version: 1
                      }
                    ],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    type: "paragraph",
                    version: 1
                  }
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "root",
                version: 1,
                __encrypted: true // Special marker to indicate encrypted content
              }
            });
          } else {
            // Not encrypted but not JSON either
            console.warn('Invalid editorState format detected, creating empty document');
            return createEmptyDocument();
          }
        }
      }
    } catch (e) {
      console.error('Error processing editor content:', e);
      return createEmptyDocument();
    }
  }
  
  // For direct content object
  if (typeof content === 'object' && !Array.isArray(content)) {
    try {
      const contentStr = JSON.stringify(content);
      try {
        validateLexicalState(contentStr); // Will throw if invalid
        return contentStr;
      } catch (validationError) {
        console.warn('Invalid Lexical state object, creating empty document:', validationError);
        return createEmptyDocument();
      }
    } catch (e) {
      console.error('Error stringifying content object:', e);
      return createEmptyDocument();
    }
  }
  
  // For string content that looks like JSON
  if (typeof content === 'string' &&
      (content.startsWith('{') || content.startsWith('['))) {
    try {
      validateLexicalState(content); // Will throw if invalid
      return content;
    } catch (e) {
      console.warn('Invalid JSON string content, creating empty document:', e);
      return createEmptyDocument();
    }
  }
  
  // For anything else, create an empty document
  console.warn('Unrecognized content format, creating empty document');
  return createEmptyDocument();
}

/**
 * Validate that a string is a proper Lexical editor state
 * @param {string} stateStr - The editor state string to validate
 * @throws {Error} If the state is invalid
 */
export function validateLexicalState(stateStr) {
  if (!stateStr || typeof stateStr !== 'string') {
    throw new Error('Editor state is empty or not a string');
  }
  
  // Trim the string to handle whitespace
  const trimmedStr = stateStr.trim();
  if (!trimmedStr) {
    throw new Error('Editor state is empty after trimming');
  }
  
  let state;
  try {
    state = JSON.parse(trimmedStr);
  } catch (e) {
    throw new Error('Editor state is not valid JSON: ' + e.message);
  }
  
  // Check for required structure
  if (!state || typeof state !== 'object') {
    throw new Error('Editor state is not an object');
  }
  
  if (!state.root) {
    throw new Error('Editor state missing root node');
  }
  
  if (!state.root.children) {
    throw new Error('Editor state root missing children');
  }
  
  if (!Array.isArray(state.root.children)) {
    throw new Error('Editor state root children is not an array');
  }
  
  // Ensure there's at least one node in the children array
  if (state.root.children.length === 0) {
    throw new Error('Editor state has empty children array');
  }
  
  // We don't strictly validate each node to be more permissive with variations
  // But we do ensure the first node has a type for minimal validation
  if (!state.root.children[0].type) {
    throw new Error('First node missing type property');
  }
  
  return true;
}

/**
 * Creates an empty Lexical document structure compatible with version 0.11+
 */
export function createEmptyDocument() {
  return JSON.stringify({
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: "",
              type: "text",
              version: 1
            }
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1
        }
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1
    }
  });
}

/**
 * Creates a simple document with optional placeholder text
 */
export function createDocumentWithText(text = "") {
  return JSON.stringify({
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: text,
              type: "text",
              version: 1
            }
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1
        }
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1
    }
  });
}

/**
 * Check if content is likely encrypted
 */
export function isLikelyEncrypted(str) {
  if (typeof str !== 'string') return false;
  
  // Base64 pattern with padding and typical encryption format markers
  const base64Pattern = /^[A-Za-z0-9+/=]+$/;
  
  // First check if it starts with JSON markers
  if (str.startsWith('{') || str.startsWith('[')) {
    try {
      // Try parsing to make sure it's valid JSON
      JSON.parse(str);
      return false; // Valid JSON is not encrypted
    } catch (e) {
      // If it starts with JSON markers but isn't valid JSON, might still be encrypted
      // Continue with other checks
    }
  }
  
  // Then check if it looks like base64 encrypted data with typical encryption markers
  const looksLikeBase64 = base64Pattern.test(str) && 
         str.length > 30 && 
         !str.includes(' ');
         
  // Additional markers that strongly indicate encryption      
  const hasEncryptionMarkers = str.includes('=') || // Base64 padding
                               str.includes(':') || // Separator used in our encryption scheme
                               (str.length % 4 === 0); // Base64 length characteristic
                               
  console.log(`String tested for encryption: ${str.substring(0, 20)}...`,
    `Looks like base64: ${looksLikeBase64}`,
    `Has encryption markers: ${hasEncryptionMarkers}`);
  
  return looksLikeBase64 && hasEncryptionMarkers;
}

/**
 * Count words in Lexical editor state
 * @param {string} editorStateStr - Stringified Lexical editor state
 * @returns {number} Word count
 */
export function countWordsInLexicalContent(editorStateStr) {
  if (!editorStateStr) return 0;
  
  try {
    const contentObj = JSON.parse(editorStateStr);
    return countWordsInLexicalNode(contentObj.root);
  } catch (error) {
    console.warn('Error counting words in Lexical content:', error);
    return 0;
  }
}

/**
 * Recursively count words in a Lexical node
 * @param {object} node - Lexical node object
 * @returns {number} Word count
 */
function countWordsInLexicalNode(node) {
  if (!node) return 0;
  
  // If it's a text node, count words in its text
  if (node.type === 'text' && node.text) {
    const text = node.text || '';
    return text.split(/\s+/).filter(Boolean).length;
  }
  
  // For other nodes, recursively count words in children
  if (Array.isArray(node.children)) {
    return node.children.reduce((total, childNode) => {
      return total + countWordsInLexicalNode(childNode);
    }, 0);
  }
  
  return 0;
}

/**
 * Extract plain text from Lexical editor state
 * @param {string} editorStateStr - Stringified Lexical editor state
 * @returns {string} Plain text content
 */
export function extractPlainTextFromLexical(editorStateStr) {
  if (!editorStateStr) return '';
  
  try {
    const contentObj = JSON.parse(editorStateStr);
    return extractTextFromLexicalNode(contentObj.root);
  } catch (error) {
    console.warn('Error extracting plain text from Lexical content:', error);
    return '';
  }
}

/**
 * Recursively extract text from a Lexical node
 * @param {object} node - Lexical node object
 * @returns {string} Plain text
 */
function extractTextFromLexicalNode(node) {
  if (!node) return '';
  
  // If it's a text node, return its text
  if (node.type === 'text' && node.text) {
    return node.text;
  }
  
  // For other nodes, recursively extract text from children
  if (Array.isArray(node.children)) {
    let text = node.children.map(childNode => extractTextFromLexicalNode(childNode)).join('');
    
    // Add newlines for block elements like paragraphs, headings, etc.
    if (['paragraph', 'heading'].includes(node.type)) {
      text += '\n';
    }
    
    return text;
  }
  
  return '';
}

/**
 * Check if a string is valid JSON
 * @param {string} str - The string to check
 * @returns {boolean} Whether the string is valid JSON
 */
export function isValidJSON(str) {
  if (!str || typeof str !== 'string') return false;
  
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}
