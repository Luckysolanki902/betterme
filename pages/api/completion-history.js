// pages/api/completion-history.js
import dbConnect from '@/middleware/connectToMongo';
import DailyCompletion from '@/models/DailyCompletion';
import { getAdjustedDateString } from '@/utils/streakUtils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get all daily completion records
    const completions = await DailyCompletion.find({})
      .sort({ date: -1 })
      .limit(365); // Last 365 days should be enough for streak calculation

    // Transform data for streak calculation
    const completionHistory = completions.map(completion => ({
      date: completion.date,
      completed: completion.todos && completion.todos.length > 0,
      totalScore: completion.totalScore || 0,
      possibleScore: completion.possibleScore || 0
    }));

    res.status(200).json(completionHistory);
  } catch (error) {
    console.error('Error fetching completion history:', error);
    res.status(500).json({ message: 'Error fetching completion history' });
  }
}
