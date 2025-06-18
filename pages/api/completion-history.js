// pages/api/completion-history.js
import dbConnect from '@/middleware/connectToMongo';
import DailyCompletion from '@/models/DailyCompletion';
import { getAdjustedDateString } from '@/utils/streakUtils';
import { getUserId } from '@/middleware/clerkAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    await dbConnect();

    // Get all daily completion records for this user
    const completions = await DailyCompletion.find({ userId })
      .sort({ date: -1 })
      .limit(365); // Last 365 days should be enough for streak calculation    // Transform data for streak calculation
    const completionHistory = completions.map(completion => {
      // Count completed todos for the day
      const completedTodos = completion.todos ? completion.todos.filter(todo => todo.completed).length : 0;
      const totalTodos = completion.todos ? completion.todos.length : 0;
      
      return {
        date: completion.date,
        completed: completedTodos > 0, // Day is completed if at least one todo was completed
        completedTodos,
        totalTodos,
        totalScore: completion.totalScore || 0,
        possibleScore: completion.possibleScore || 0
      };
    });

    res.status(200).json(completionHistory);
  } catch (error) {
    console.error('Error fetching completion history:', error);
    res.status(500).json({ message: 'Error fetching completion history' });
  }
}
