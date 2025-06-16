// pages/api/journal/index.js
import connectToMongo from '@/middleware/connectToMongo';
import JournalEntry from '@/models/JournalEntry';
const { encryptJournalEntry, decryptJournalEntries, getUserId } = require('@/middleware/journalEncryption');

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
        .lean();
        
        // Decrypt the entries
        const decryptedEntries = decryptJournalEntries(entries, userId);
        
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
        }
        
        // Calculate word count
        let wordCount = 0;
        if (Array.isArray(content)) {
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
        
        // Create the new entry object
        const newEntry = {
          entryDate: new Date(entryDate),
          title: title || '',
          content: content || [],
          mood: mood || { score: 5, label: 'neutral' },
          tags: tags || [],
          wordCount,
          userId
        };
        
        // Encrypt the sensitive fields
        const encryptedEntry = encryptJournalEntry(newEntry, userId);
        
        // Save to database
        const savedEntry = await JournalEntry.create(encryptedEntry);
        
        // Return success with the ID only
        return res.status(201).json({ 
          success: true, 
          _id: savedEntry._id,
          entryDate: savedEntry.entryDate
        });
      } catch (error) {
        console.error('Error creating journal entry:', error);
        return res.status(500).json({ error: 'Failed to create journal entry' });
      }
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
