import connectToMongo from '@/middleware/connectToMongo';
import DailyCompletion from '@/models/DailyCompletion';
import { startOfWeek, endOfWeek, format } from 'date-fns';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    
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
