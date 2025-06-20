// pages/api/journal/index.js
import connectToMongo from '@/middleware/connectToMongo';
import JournalEntry from '@/models/JournalEntry';
import { getUserId } from '@/middleware/clerkAuth';
import { encryptFields, decryptFields, ENCRYPTED_FIELDS } from '@/utils/encryption';

// Helper function to count words in Lexical editorState
function countWordsInLexicalContent(editorStateStr) {
  try {
    // Parse the Lexical editor state JSON
    const editorState = JSON.parse(editorStateStr);
    
    // Recursively extract text from the editor state
    function extractTextFromNode(node) {
      let text = '';
      
      // Handle text nodes
      if (node.type === 'text') {
        return node.text || '';
      }
      
      // Handle nodes with children (paragraphs, headings, lists, etc.)
      if (node.children) {
        node.children.forEach((childNode) => {
          text += ' ' + extractTextFromNode(childNode);
        });
      }
      
      return text;
    }
    
    // Extract text from the root node's children
    const textContent = extractTextFromNode(editorState.root);
    
    // Count words (split by whitespace and filter out empty strings)
    const words = textContent.trim().split(/\s+/).filter(Boolean);
    return words.length;
  } catch (error) {
    console.error('Error counting words in Lexical content:', error);
    return 0;
  }
}

// API handler for /api/journal
// Handles:
// - GET: Fetches journal entries by date range or month
// - POST: Creates a new journal entry
const handler = async (req, res) => {  // Get the user ID for encryption/decryption
  const userId = getUserId(req);

  switch (req.method) {
    case 'GET':
      try {
        // Parse query parameters
        const { year, month, start, end, limit = 31 } = req.query;
        
        // Build the date filter query
        let dateFilter = {};
        
        // If specific year and month are provided
        if (year && month) {
          // Create start and end dates for the requested month
          const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month
          
          dateFilter = {
            entryDate: {
              $gte: startDate,
              $lte: endDate
            }
          };
        }
        // If specific date range is provided
        else if (start && end) {
          dateFilter = {
            entryDate: {
              $gte: new Date(start),
              $lte: new Date(end)
            }
          };
        }
        // Default to current month if no date params
        else {
          const now = new Date();
          const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          
          dateFilter = {
            entryDate: {
              $gte: startDate,
              $lte: endDate
            }
          };
        }
          // Query for entries matching the user ID and date filter
        const entries = await JournalEntry.find({ 
          userId,
          ...dateFilter
        })
        .sort({ entryDate: -1 })
        .limit(parseInt(limit))
        .lean();        // Decrypt entries before returning
        const decryptedEntries = entries.map(entry => {
          // First decrypt the basic fields like title
          const decryptedEntry = decryptFields(entry, ['title'], userId);
          
          // Decrypt the Lexical editorState
          if (entry.content && entry.content.editorState) {
            try {
              // Check if the content appears to be encrypted
              if (typeof entry.content.editorState === 'string') {
                try {
                  const decryptResult = decryptFields(
                    { text: entry.content.editorState },
                    ['text'],
                    userId
                  );
                  
                  if (decryptResult && decryptResult.text) {
                    decryptedEntry.content = { 
                      editorState: decryptResult.text 
                    };
                  }
                } catch (err) {
                  console.warn('Failed to decrypt Lexical content, using as-is:', err);
                  // Keep original content if decryption fails
                  decryptedEntry.content = entry.content;
                }              }
            } catch (err) {
              console.error('Error processing Lexical content:', err);
              decryptedEntry.content = entry.content;
            }
          }
          
          // Manually decrypt tags
          if (Array.isArray(decryptedEntry.tags) && decryptedEntry.tags.length > 0) {
            decryptedEntry.tags = decryptedEntry.tags.map(tag => {
              const decryptedTag = { ...tag };
              if (typeof decryptedTag.name === 'string' && decryptedTag.name.trim() !== '') {
                try {
                  if (decryptedTag.name.match(/^[A-Za-z0-9+/=]+$/) && decryptedTag.name.length > 20) {
                    const decryptResult = decryptFields({ text: decryptedTag.name }, ['text'], userId);
                    if (decryptResult && decryptResult.text) {
                      decryptedTag.name = decryptResult.text;
                    }
                  }
                } catch (err) {
                  console.error('Failed to decrypt tag name:', err);
                }
              }
              return decryptedTag;
            });
          }
          
          return decryptedEntry;
        });
        
        return res.status(200).json(decryptedEntries);
      } catch (error) {
        console.error('Error fetching journal entries:', error);
        return res.status(500).json({ error: 'Failed to fetch journal entries' });
      }
      
    case 'POST':
      try {
        // Get entry data from request
        const { entryDate, title, content, mood, tags } = req.body;
        
        if (!entryDate) {
          return res.status(400).json({ error: 'Entry date is required' });
        }
        
        // Check if an entry already exists for this date
        const existingEntry = await JournalEntry.findOne({ 
          userId,
          entryDate: new Date(entryDate)
        });
        
        if (existingEntry) {
          return res.status(409).json({ error: 'Journal entry already exists for this date' });
        }        // Calculate word count for Lexical format
        let wordCount = 0;
        if (content && content.editorState) {
          try {
            // Calculate word count using the helper function
            wordCount = countWordsInLexicalContent(content.editorState);
          } catch (error) {
            console.error('Error calculating word count:', error);
            wordCount = 0;
          }
        }
        
        // Create the new entry object
        const newEntry = {
          entryDate: new Date(entryDate),
          title: title || '',
          content: {
            editorState: content?.editorState || JSON.stringify({
              root: {
                children: [
                  {
                    children: [],
                    direction: null,
                    format: "",
                    indent: 0,
                    type: "paragraph",
                    version: 1
                  }
                ],
                direction: null,
                format: "",
                indent: 0,
                type: "root",
                version: 1
              }
            })
          },
          mood: mood || { score: 5, label: 'neutral' },
          tags: tags || [],
          wordCount,
          userId
        };
          // Create the entry with title encrypted
        const encryptedEntry = encryptFields(newEntry, ['title'], userId);
          // Handle Lexical editor content - encrypt the entire editorState JSON string
        if (newEntry.content && newEntry.content.editorState) {
          try {
            encryptedEntry.content = {
              editorState: encryptFields(
                { text: newEntry.content.editorState }, 
                ['text'], 
                userId
              ).text
            };
          } catch (err) {
            console.error('Failed to encrypt editor content:', err);
            // Keep original content if encryption fails
            encryptedEntry.content = newEntry.content;
          }
        }
        
        // Manually handle tags - encrypt tag names
        if (Array.isArray(encryptedEntry.tags) && encryptedEntry.tags.length > 0) {
          encryptedEntry.tags = encryptedEntry.tags.map(tag => {
            const encryptedTag = { ...tag };
            if (typeof encryptedTag.name === 'string' && encryptedTag.name.trim() !== '') {
              try {
                encryptedTag.name = encryptFields({ text: encryptedTag.name }, ['text'], userId).text;
              } catch (err) {
                console.error('Failed to encrypt tag name:', err);
              }
            }
            return encryptedTag;
          });
        }
        
        // Save to database
        const savedEntry = await JournalEntry.create(encryptedEntry);
          // Get the base object with title decrypted
        const savedEntryObj = savedEntry.toObject();
        const decryptedSavedEntry = decryptFields(savedEntryObj, ENCRYPTED_FIELDS.JOURNAL, userId);
        
        // Manually decrypt content blocks
        if (Array.isArray(decryptedSavedEntry.content) && decryptedSavedEntry.content.length > 0) {
          decryptedSavedEntry.content = decryptedSavedEntry.content.map(block => {
            const decryptedBlock = { ...block };
            
            // Decrypt content field in each block
            if (typeof decryptedBlock.content === 'string' && decryptedBlock.content.trim() !== '') {
              try {
                // First check if the content appears to be encrypted
                if (decryptedBlock.content.match(/^[A-Za-z0-9+/=]+$/) && decryptedBlock.content.length > 20) {
                  try {
                    const decryptResult = decryptFields({ text: decryptedBlock.content }, ['text'], userId);
                    if (decryptResult && decryptResult.text) {
                      decryptedBlock.content = decryptResult.text;
                    }
                  } catch (err) {
                    console.warn('Failed to decrypt block content, using as-is:', err);
                    // Keep original content if decryption fails
                  }
                }
              } catch (err) {
                console.error('Error processing block content:', err);
              }
            }
            
            // Decrypt list items if present
            if (Array.isArray(decryptedBlock.listItems) && decryptedBlock.listItems.length > 0) {
              decryptedBlock.listItems = decryptedBlock.listItems.map(item => {
                const decryptedItem = { ...item };
                if (typeof decryptedItem.content === 'string' && decryptedItem.content.trim() !== '') {
                  try {
                    if (decryptedItem.content.match(/^[A-Za-z0-9+/=]+$/) && decryptedItem.content.length > 20) {
                      const decryptResult = decryptFields({ text: decryptedItem.content }, ['text'], userId);
                      if (decryptResult && decryptResult.text) {
                        decryptedItem.content = decryptResult.text;
                      }
                    }
                  } catch (err) {
                    console.error('Failed to decrypt list item content:', err);
                  }
                }
                return decryptedItem;
              });
            }
            
            return decryptedBlock;
          });
        }
        
        // Manually decrypt tags
        if (Array.isArray(decryptedSavedEntry.tags) && decryptedSavedEntry.tags.length > 0) {
          decryptedSavedEntry.tags = decryptedSavedEntry.tags.map(tag => {
            const decryptedTag = { ...tag };
            if (typeof decryptedTag.name === 'string' && decryptedTag.name.trim() !== '') {
              try {
                if (decryptedTag.name.match(/^[A-Za-z0-9+/=]+$/) && decryptedTag.name.length > 20) {
                  const decryptResult = decryptFields({ text: decryptedTag.name }, ['text'], userId);
                  if (decryptResult && decryptResult.text) {
                    decryptedTag.name = decryptResult.text;
                  }
                }
              } catch (err) {
                console.error('Failed to decrypt tag name:', err);
              }
            }
            return decryptedTag;
          });
        }
        
        // Return the saved entry
        return res.status(201).json(decryptedSavedEntry);
      } catch (error) {
        console.error('Error creating journal entry:', error);
        return res.status(500).json({ error: 'Failed to create journal entry' });
      }
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
