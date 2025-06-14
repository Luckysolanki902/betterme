import connectToMongo from '@/middleware/connectToMongo';
import DailyCompletion from '@/models/DailyCompletion';
import Config from '@/models/Config';
import { format } from 'date-fns';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      // Get config to find the start date
      const config = await Config.findOne();
      const start = config?.startDate || new Date('2024-09-27T00:00:00Z');
      
      // Set the end date to today
      const end = new Date();

      const dailyCompletions = await DailyCompletion.find({
        date: { $gte: start, $lte: end },
      }).sort({ date: 1 });

      const data = dailyCompletions.map(dc => ({
        date: format(dc.date, 'yyyy-MM-dd'),
        score: dc.score || 0,
        totalPossibleScore: dc.totalPossibleScore || 0,
      }));

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching progress data:', error);
      return res.status(500).json({ error: 'Failed to fetch progress data' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
