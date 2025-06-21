// pages/api/reset-all.js
import connectToMongo from '@/middleware/connectToMongo';
import Todo from '@/models/Todo';
import JournalEntry from '@/models/JournalEntry';
import PlannerPage from '@/models/PlannerPage';
import DailyCompletion from '@/models/DailyCompletion';
import Config from '@/models/Config';
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

    // Delete all data for this user
    await Promise.all([
      Todo.deleteMany({ userId }),
      JournalEntry.deleteMany({ userId }),
      PlannerPage.deleteMany({ userId }),
      DailyCompletion.deleteMany({ userId }),
      Config.deleteOne({ userId })
    ]);

    // Create a new Config with a fresh start date
    const newConfig = new Config({
      userId,
      totalScore: 0,
      totalPossibleScore: 0,
      startDate: new Date(),
      scoresByDay: {}
    });
    await newConfig.save();

    return res.status(200).json({ 
      success: true, 
      message: 'All user data deleted successfully',
      newConfigId: newConfig._id
    });
  } catch (error) {
    console.error('Error resetting all data:', error);
    return res.status(500).json({ error: 'Failed to reset all data' });
  }
};

export default connectToMongo(handler);
