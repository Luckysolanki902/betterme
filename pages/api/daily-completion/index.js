import connectToMongo from '@/middleware/connectToMongo';
import DailyCompletion from '@/models/DailyCompletion';
import { format } from 'date-fns';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    const today = format(new Date(), 'yyyy-MM-dd');
    const dailyCompletion = await DailyCompletion.findOne({ date: today });
    if (!dailyCompletion) {
      return res.status(200).json({ completedTodos: [], percentage: 0 });
    }
    return res.status(200).json({
      completedTodos: dailyCompletion.completedTodos,
      percentage: dailyCompletion.percentage,
    });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
