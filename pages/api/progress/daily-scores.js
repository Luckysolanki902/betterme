// pages/api/progress/daily-scores.js
import connectToMongo from '@/middleware/connectToMongo';
import Config from '@/models/Config';
import DailyCompletion from '@/models/DailyCompletion';
import { getUserId } from '@/middleware/clerkAuth';
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  subDays,
  eachDayOfInterval,
  format,
  parseISO
} from 'date-fns';

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get query parameters
    const { period = 'week' } = req.query;
    const today = new Date();

    // Determine date range based on period
    let startDate, endDate;
    switch (period) {
      case 'week':
        startDate = startOfWeek(today, { weekStartsOn: 1 }); // Week starts on Monday
        endDate = endOfDay(today);
        break;
      case 'month':
        startDate = startOfMonth(today);
        endDate = endOfDay(today);
        break;
      case 'all':
        // Get user's config to find start date
        const config = await Config.findOne({ userId });
        startDate = config?.startDate || subDays(today, 30);
        endDate = endOfDay(today);
        break;
      case 'day':
      default:
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
    }

    // Generate all days in the period
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Initialize result array with all days
    const scoreData = days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      return {
        date: dateStr,
        score: 0,
        totalPossible: 0
      };
    });

    // Get all daily completions for the period
    const dailyCompletions = await DailyCompletion.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Process completions and update score data
    dailyCompletions.forEach(completion => {
      const dateStr = format(completion.date, 'yyyy-MM-dd');
      const dayData = scoreData.find(day => day.date === dateStr);
      
      if (dayData) {
        dayData.score = completion.score || 0;
        dayData.totalPossible = completion.totalPossibleScore || 0;
      }
    });

    return res.status(200).json(scoreData);
  } catch (error) {
    console.error('Error fetching daily score data:', error);
    return res.status(500).json({ error: 'Failed to fetch daily score data' });
  }
};

export default connectToMongo(handler);
