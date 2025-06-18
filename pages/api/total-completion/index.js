import connectToMongo from '@/middleware/connectToMongo';
import Config from '@/models/Config';
import Todo from '@/models/Todo';
import DailyCompletion from '@/models/DailyCompletion';
import { startOfDay, format } from 'date-fns';
import { getUserId } from '@/middleware/clerkAuth';
import { decryptArray, ENCRYPTED_FIELDS } from '@/utils/encryption';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Get config or initialize if not exists
      let config = await Config.findOne({ userId });
      if (!config) {
        config = new Config({
          userId,
          totalScore: 0,
          totalPossibleScore: 0,
          startDate: new Date(),
          scoresByDay: {}
        });
        await config.save();
      }
      
      // Get user's todos and decrypt them
      const todos = await Todo.find({ userId });
      const decryptedTodos = decryptArray(todos, ENCRYPTED_FIELDS.TODO, userId);
      
      // Calculate total possible score from all todos
      const totalPossibleScore = decryptedTodos.reduce((sum, todo) => {
        return sum + (todo.score || getDifficultyScore(todo.difficulty));
      }, 0);
      
      // Get today's completion
      const today = startOfDay(new Date());
      const todayStr = format(today, 'yyyy-MM-dd');
      
      // Get daily completion
      const dailyCompletion = await DailyCompletion.findOne({ 
        userId,
        date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } 
      });
      
      // Calculate today's scores
      let todayScore = 0;
      if (dailyCompletion && dailyCompletion.completedTodos.length > 0) {
        // Get completed todos and calculate score
        const completedTodoIds = dailyCompletion.completedTodos;
        const completedTodos = decryptedTodos.filter(todo => 
          completedTodoIds.some(id => id.toString() === todo._id.toString())
        );
        todayScore = completedTodos.reduce((sum, todo) => {
          return sum + (todo.score || getDifficultyScore(todo.difficulty));
        }, 0);
      }
      
      const todayPossible = totalPossibleScore > 0 ? totalPossibleScore : 100; // Default to 100 if no todos
      
      // Calculate improvement percentage (this could be enhanced with historical data)
      const improvementRatio = todayPossible > 0 
        ? (todayScore ) / 100
        : 0;
        
      return res.status(200).json({ 
        totalScore: config.totalScore || todayScore,
        totalPossibleScore: config.totalPossibleScore || todayPossible,
        improvement: improvementRatio.toFixed(1),
        todayScore: todayScore,
        todayPossibleScore: todayPossible,
        scoreRatio: ((todayScore / Math.max(todayPossible, 1)) * 100).toFixed(1),
        completionPercentage: ((todayScore / Math.max(todayPossible, 1)) * 100).toFixed(0)
      });
    } catch (error) {
      console.error('Error fetching score data:', error);
      return res.status(500).json({ error: 'Failed to fetch score data', details: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

/**
 * Helper function to convert difficulty to numeric score
 */
function getDifficultyScore(difficulty) {
  switch (difficulty) {
    case 'hard': return 10;
    case 'challenging': return 7;
    case 'medium': return 5;
    case 'light': return 3;
    case 'easy': return 1;
    default: return 5;
  }
}

export default connectToMongo(handler);
