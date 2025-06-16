// pages/api/journal/[id].js
import connectToMongo from '@/middleware/connectToMongo';
import JournalEntry from '@/models/JournalEntry';
const { encryptJournalEntry, decryptJournalEntry, getUserId } = require('@/middleware/journalEncryption');

// API handler for /api/journal/[id]
// Handles:
// - GET: Fetches a specific journal entry by ID
// - PUT: Updates a specific journal entry
// - DELETE: Deletes a journal entry
const handler = async (req, res) => {  // Get the user ID for encryption/decryption
  const userId = getUserId(req);
  
  // Get the entry ID from the URL
  const { id } = req.query;
  
  switch (req.method) {
    case 'GET':
      try {
        // Fetch the entry
        const entry = await JournalEntry.findOne({ 
          _id: id,
          userId
        }).lean();
        
        if (!entry) {
          return res.status(404).json({ error: 'Journal entry not found' });
        }
        
        // Decrypt the entry
        const decryptedEntry = decryptJournalEntry(entry, userId);
        
        return res.status(200).json(decryptedEntry);
      } catch (error) {
        console.error('Error fetching journal entry:', error);
        return res.status(500).json({ error: 'Failed to fetch journal entry' });
      }
      
    case 'PUT':
      try {
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
        
        // Encrypt the sensitive fields
        const encryptedUpdates = encryptJournalEntry(updates, userId);
        
        // Update in database
        const updatedEntry = await JournalEntry.findOneAndUpdate(
          { _id: id, userId },
          { $set: encryptedUpdates },
          { new: true }
        );
        
        return res.status(200).json({ 
          success: true, 
          _id: updatedEntry._id,
          lastEditedAt: updatedEntry.lastEditedAt
        });
      } catch (error) {
        console.error('Error updating journal entry:', error);
        return res.status(500).json({ error: 'Failed to update journal entry' });
      }
      
    case 'DELETE':
      try {
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
