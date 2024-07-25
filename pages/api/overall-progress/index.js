import connectToMongo from '@/middleware/connectToMongo';
import DailyCompletion from '@/models/DailyCompletion';
import { format } from 'date-fns';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    // Set the start date to July 23, 2024
    const start = new Date('2024-07-22T00:00:00Z');
    // Set the end date to today
    const end = new Date();

    const dailyCompletions = await DailyCompletion.find({
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    const data = dailyCompletions.map(dc => ({
      date: format(dc.date, 'yyyy-MM-dd'),
      percentage: dc.percentage,
    }));

    return res.status(200).json(data);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
