// pages/api/planner/reset.js
import connectToMongo from '@/middleware/connectToMongo';
import PlannerPage from '@/models/PlannerPage';
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

    // Delete all planner pages for this user
    await PlannerPage.deleteMany({ userId });

    return res.status(200).json({ success: true, message: 'All planner pages deleted successfully' });
  } catch (error) {
    console.error('Error deleting planner pages:', error);
    return res.status(500).json({ error: 'Failed to delete planner pages' });
  }
};

export default connectToMongo(handler);
