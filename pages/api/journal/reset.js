// pages/api/journal/reset.js
import connectToMongo from '@/middleware/connectToMongo';
import JournalEntry from '@/models/JournalEntry';
import { getUserId } from '@/middleware/clerkAuth';

const handler = async (req, res) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete all journal entries for this user
    await JournalEntry.deleteMany({ userId });

    return res.status(200).json({ success: true, message: 'All journal entries deleted successfully' });
  } catch (error) {
    console.error('Error deleting journal entries:', error);
    return res.status(500).json({ error: 'Failed to delete journal entries' });
  }
};

export default connectToMongo(handler);
