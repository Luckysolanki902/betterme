// pages/api/journal/index.js
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

// API handler for /api/journal
// Handles:
// - GET: Fetches journal entries by date range or month
// - POST: Creates a new journal entry
const handler = async (req, res) => {  
  // Get the user ID for encryption/decryption
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
          // Decrypt entries before returning
        const decryptedEntries = entries.map(entry => {
          // Decrypt the content
          const decryptedEntry = {...entry};
          
          if (entry.content) {
            try {
              // Decrypt the content
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
              // Ensure content is a string even if decryption fails
              decryptedEntry.content = typeof entry.content === 'string' ? entry.content : '';
            }
          } else {
            // Make sure content is at least an empty string
            decryptedEntry.content = '';
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
        const { entryDate, content, mood, tags } = req.body;
        
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
        if (content) {
          wordCount = countWords(content);
        }
          // Create the new entry object
        const newEntry = {
          entryDate: new Date(entryDate),
          content: typeof content === 'string' ? content : '',
          mood: mood || { score: 5, label: 'neutral' },
          tags: tags || [],
          wordCount,
          userId,
        };
        
        // Encrypt sensitive data
        const encryptedEntry = {...newEntry};
        
        // Encrypt content - always ensure we have a string
        const contentToEncrypt = typeof newEntry.content === 'string' ? newEntry.content : '';
        encryptedEntry.content = encryptFields({ text: contentToEncrypt }, ['text'], userId).text;
        
        // Save to database
        const savedEntry = await JournalEntry.create(encryptedEntry);
        
        // Get the base object
        const savedEntryObj = savedEntry.toObject();
        
        // Decrypt content for the response
        const decryptedSavedEntry = {...savedEntryObj};
        
        if (savedEntryObj.content) {
          try {
            const decryptResult = decryptFields(
              { text: savedEntryObj.content },
              ['text'],
              userId
            );
            
            if (decryptResult && decryptResult.text) {
              decryptedSavedEntry.content = decryptResult.text;
            }
          } catch (err) {
            console.warn('Failed to decrypt content for response, using as-is:', err);
          }
        }
        
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
