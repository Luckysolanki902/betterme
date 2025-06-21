// pages/api/journal/[id].js
import connectToMongo from '@/middleware/connectToMongo';
import JournalEntry from '@/models/JournalEntry';
import { getUserId } from '@/middleware/clerkAuth';
import { encryptFields, decryptFields, ENCRYPTED_FIELDS } from '@/utils/encryption';

// Helper function to count words in text content
function countWords(text) {
  try {
    // Count words (split by whitespace and filter out empty strings)
    return text.trim().split(/\s+/).filter(Boolean).length;
  } catch (error) {
    console.error('Error counting words:', error);
    return 0;
  }
}

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

        // Find the entry by ID and user ID
        const entry = await JournalEntry.findOne({ 
          _id: id,
          userId
        }).lean();
        
        if (!entry) {
          return res.status(404).json({ error: 'Journal entry not found' });
        }        // Decrypt the content
        const decryptedEntry = {...entry};
        
        if (entry.content) {
          try {
            const decryptResult = decryptFields(
              { text: entry.content },
              ['text'],
              userId
            );
            
            if (decryptResult && decryptResult.text) {
              decryptedEntry.content = decryptResult.text;
            }
          } catch (err) {
            console.warn('Failed to decrypt content, using as-is:', err);
            // Ensure we still have a string even if decryption fails
            decryptedEntry.content = typeof entry.content === 'string' ? entry.content : '';
          }
        } else {
          // Make sure content is at least an empty string
          decryptedEntry.content = '';
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

        // Get update data from request body
        const updates = req.body;
        
        // Calculate word count if content is provided
        if (updates.content) {
          updates.wordCount = countWords(updates.content);
        }
        
        // Add last edited timestamp
        updates.lastEditedAt = new Date();
          // Create encrypted update object
        const encryptedUpdates = {...updates};
        
        // Encrypt content if provided - ensure it's a string
        if ('content' in updates) {
          const contentToEncrypt = typeof updates.content === 'string' ? updates.content : '';
          encryptedUpdates.content = encryptFields({ text: contentToEncrypt }, ['text'], userId).text;
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
        
        // Get the updated entry as an object
        const updatedEntryObj = updatedEntry.toObject();
        
        // Decrypt content for response
        const decryptedUpdatedEntry = {...updatedEntryObj};
        
        if (updatedEntryObj.content) {
          try {
            const decryptResult = decryptFields(
              { text: updatedEntryObj.content },
              ['text'],
              userId
            );
            
            if (decryptResult && decryptResult.text) {
              decryptedUpdatedEntry.content = decryptResult.text;
            }
          } catch (err) {
            console.warn('Failed to decrypt content for response, using as-is:', err);
          }
        }
        
        return res.status(200).json(decryptedUpdatedEntry);
      } catch (error) {
        console.error('Error updating journal entry:', error);
        return res.status(500).json({ error: 'Failed to update journal entry' });
      }
      
    case 'DELETE':
      try {
        const userId = getUserId(req);
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        // Find and delete the entry
        const deletedEntry = await JournalEntry.findOneAndDelete({ 
          _id: id,
          userId
        });
        
        if (!deletedEntry) {
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
