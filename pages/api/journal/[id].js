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
const handler = async (req, res) => {
  // Get the entry ID from the URL
  const { id } = req.query;

  // Check if ID is defined and valid
  if (!id || id === 'undefined' || id === 'null') {
    return res.status(400).json({ error: 'Invalid journal entry ID' });
  }  
  switch (req.method) {
    case 'GET':
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
        }
        
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
              }
            }
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
        
        // Calculate word count for Lexical content
        let wordCount = existingEntry.wordCount;
        if (content && content.editorState) {
          try {
            // Helper function to count words in Lexical editorState
            const countWordsInLexicalContent = (editorStateStr) => {
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
            };
              wordCount = countWordsInLexicalContent(content.editorState);
          } catch (error) {
            console.error('Error calculating word count:', error);
          }
        }
        
        // Create updated entry object with only changed fields
        const updates = {};
        if (title !== undefined) updates.title = title;
        if (mood !== undefined) updates.mood = mood;
        if (tags !== undefined) updates.tags = tags;
        if (wordCount !== undefined) updates.wordCount = wordCount;
        updates.lastEditedAt = new Date();
          // Encrypt title only to start with
        const encryptedUpdates = encryptFields(updates, ['title'], userId);
        
        // Handle Lexical editor content - encrypt the entire editorState JSON string
        if (content && content.editorState) {
          try {
            encryptedUpdates.content = {
              editorState: encryptFields(
                { text: content.editorState }, 
                ['text'], 
                userId
              ).text
            };          } catch (err) {
            console.error('Failed to encrypt editor state content:', err);
          }
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
          if (!updatedEntry) {
          return res.status(404).json({ error: 'Failed to update entry' });
        }
        
        // Decrypt the updated entry for response
        const decryptedEntry = decryptFields(updatedEntry.toObject(), ['title'], userId);
        
        // Decrypt the Lexical editorState
        if (updatedEntry.content && updatedEntry.content.editorState) {
          try {
            if (typeof updatedEntry.content.editorState === 'string') {
              const decryptResult = decryptFields(
                { text: updatedEntry.content.editorState },
                ['text'],
                userId
              );
              
              if (decryptResult && decryptResult.text) {
                decryptedEntry.content = { 
                  editorState: decryptResult.text 
                };
              }
            }
          } catch (err) {
            console.error('Error decrypting updated entry content:', err);
          }
        }
        
        // Decrypt tags
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
        
        return res.status(200).json(decryptedEntry);      } catch (error) {
        console.error('Error updating journal entry:', error);
        return res.status(500).json({ error: 'Failed to update journal entry' });
      }
      
    case 'DELETE':
      try {
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
