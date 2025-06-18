// pages/api/journal/[id].js
import connectToMongo from '@/middleware/connectToMongo';
import JournalEntry from '@/models/JournalEntry';
import { getUserId } from '@/middleware/clerkAuth';
import { encryptFields, decryptFields, ENCRYPTED_FIELDS } from '@/utils/encryption';

// API handler for /api/journal/[id]
// Handles:
// - GET: Fetches a specific journal entry by ID
// - PUT: Updates a specific journal entry
// - DELETE: Deletes a journal entry
const handler = async (req, res) => {  // Get the entry ID from the URL
  const { id } = req.query;

  // Check if ID is defined and valid
  if (!id || id === 'undefined' || id === 'null') {
    return res.status(400).json({ error: 'Invalid journal entry ID' });
  }
  
  switch (req.method) {case 'GET':
      try {
        const userId = getUserId(req);
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
          // Fetch the entry
        const entry = await JournalEntry.findOne({ 
          _id: id,
          userId
        }).lean();
        
        if (!entry) {
          return res.status(404).json({ error: 'Journal entry not found' });
        }          // First decrypt the basic fields
        const decryptedEntry = decryptFields(entry, ENCRYPTED_FIELDS.JOURNAL, userId);
          
        // Manually decrypt content blocks
        if (Array.isArray(decryptedEntry.content) && decryptedEntry.content.length > 0) {
          decryptedEntry.content = decryptedEntry.content.map(block => {
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
        
        return res.status(200).json(decryptedEntry);
      } catch (error) {
        console.error('Error fetching journal entry:', error);
        return res.status(500).json({ error: 'Failed to fetch journal entry' });
      }
        case 'PUT':
      try {
        const userId = getUserId(req);
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Get updated data
        const { title, content, mood, tags } = req.body;
        
        // Find the entry to update
        const existingEntry = await JournalEntry.findOne({ 
          _id: id,
          userId
        });
        
        if (!existingEntry) {
          return res.status(404).json({ error: 'Journal entry not found' });
        }
          // Calculate word count if content provided
        let wordCount = existingEntry.wordCount;
        if (Array.isArray(content)) {
          wordCount = 0;
          content.forEach(block => {
            if (block.content) {
              wordCount += block.content.trim().split(/\s+/).length;
            }
            if (Array.isArray(block.listItems)) {
              block.listItems.forEach(item => {
                if (item.content) {
                  wordCount += item.content.trim().split(/\s+/).length;
                }
              });
            }
          });
        }
          // Create updated entry object with only changed fields
        const updates = {};
        if (title !== undefined) updates.title = title;
        if (content !== undefined) updates.content = content;
        if (mood !== undefined) updates.mood = mood;
        if (tags !== undefined) updates.tags = tags;
        if (wordCount !== undefined) updates.wordCount = wordCount;
        updates.lastEditedAt = new Date();
          // Encrypt title only to start with
        const encryptedUpdates = encryptFields(updates, ENCRYPTED_FIELDS.JOURNAL, userId);
        
        // If content is being updated, encrypt each content block individually
        if (Array.isArray(updates.content)) {
          encryptedUpdates.content = updates.content.map(block => {
            const encryptedBlock = { ...block };
            
            // Encrypt the content field in each block if it's a string
            if (typeof encryptedBlock.content === 'string' && encryptedBlock.content.trim() !== '') {
              try {
                encryptedBlock.content = encryptFields({ text: encryptedBlock.content }, ['text'], userId).text;
              } catch (err) {
                console.error('Failed to encrypt block content:', err);
                // Keep original content if encryption fails
              }
            }
            
            // Encrypt list items if present
            if (Array.isArray(encryptedBlock.listItems) && encryptedBlock.listItems.length > 0) {
              encryptedBlock.listItems = encryptedBlock.listItems.map(item => {
                const encryptedItem = { ...item };
                if (typeof encryptedItem.content === 'string' && encryptedItem.content.trim() !== '') {
                  try {
                    encryptedItem.content = encryptFields({ text: encryptedItem.content }, ['text'], userId).text;
                  } catch (err) {
                    console.error('Failed to encrypt list item content:', err);
                  }
                }
                return encryptedItem;
              });
            }
            
            return encryptedBlock;
          });
        }
        
        // If tags are being updated, encrypt each tag name individually
        if (Array.isArray(updates.tags)) {
          encryptedUpdates.tags = updates.tags.map(tag => {
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
        
        // Update in database
        const updatedEntry = await JournalEntry.findOneAndUpdate(
          { _id: id, userId },
          { $set: encryptedUpdates },
          { new: true }
        );
        
        // Start with basic decryption
        const baseDecryptedEntry = decryptFields(updatedEntry.toObject(), ENCRYPTED_FIELDS.JOURNAL, userId);
        
        // Manually decrypt content blocks
        if (Array.isArray(baseDecryptedEntry.content) && baseDecryptedEntry.content.length > 0) {
          baseDecryptedEntry.content = baseDecryptedEntry.content.map(block => {
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
        if (Array.isArray(baseDecryptedEntry.tags) && baseDecryptedEntry.tags.length > 0) {
          baseDecryptedEntry.tags = baseDecryptedEntry.tags.map(tag => {
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
        
        const decryptedUpdatedEntry = baseDecryptedEntry;
        
        return res.status(200).json(decryptedUpdatedEntry);
      } catch (error) {
        console.error('Error updating journal entry:', error);
        return res.status(500).json({ error: 'Failed to update journal entry' });
      }
      
    case 'DELETE':      try {
        const userId = getUserId(req);
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Delete the entry
        const result = await JournalEntry.deleteOne({
          _id: id,
          userId
        });
        
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Journal entry not found' });
        }
        
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error deleting journal entry:', error);
        return res.status(500).json({ error: 'Failed to delete journal entry' });
      }
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
