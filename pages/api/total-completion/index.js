import connectToMongo from '@/middleware/connectToMongo';
import Config from '@/models/Config';
import Todo from '@/models/Todo';
import DailyCompletion from '@/models/DailyCompletion';
import { startOfDay, format } from 'date-fns';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      // Get config or initialize if not exists
      let config = await Config.findOne();
      if (!config) {
        config = new Config({
          totalScore: 0,
          totalPossibleScore: 0,
          startDate: new Date(),
          scoresByDay: {}
        });
        await config.save();
      }
      
      // Calculate total possible score from all todos
      const todos = await Todo.find({});
      const totalPossibleScore = todos.reduce((sum, todo) => sum + todo.score, 0);
      
      // Get today's completion
      const today = startOfDay(new Date());
      const todayStr = format(today, 'yyyy-MM-dd');
      
      // Get daily completion
      const dailyCompletion = await DailyCompletion.findOne({ 
        date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } 
      }).populate('completedTodos');
      
      // Calculate today's scores
      const todayScore = dailyCompletion 
        ? dailyCompletion.completedTodos.reduce((sum, todo) => sum + todo.score, 0)
        : 0;
      
      const todayPossible = todos.length > 0 ? totalPossibleScore : 100; // Default to 100 if no todos
      
      // Calculate improvement percentage
      const improvementRatio = config.totalPossibleScore > 0 
        ? (config.totalScore / config.totalPossibleScore) * 100
        : 0;
        
      return res.status(200).json({ 
        totalScore: config.totalScore,
        totalPossibleScore: config.totalPossibleScore,
        improvement: improvementRatio.toFixed(1),
        todayScore: todayScore,
        todayPossibleScore: todayPossible,
        scoreRatio: ((config.totalScore / Math.max(config.totalPossibleScore, 1)) * 100).toFixed(1)
      });
    } catch (error) {
      console.error('Error fetching score data:', error);
      return res.status(500).json({ error: 'Failed to fetch score data' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
