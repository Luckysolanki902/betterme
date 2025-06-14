// pages/api/progress/trend.js
import connectToMongo from '@/middleware/connectToMongo';
import DailyCompletion from '@/models/DailyCompletion';
import Todo from '@/models/Todo';
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  addDays,
  addHours,
  eachDayOfInterval,
  eachHourOfInterval,
  format
} from 'date-fns';

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get query parameters
    const { period = 'day', category = 'all' } = req.query;
    const today = new Date();

    // Determine date range based on period
    let startDate, endDate, intervalFunction, formatFunc;
    switch (period) {
      case 'week':
        startDate = startOfWeek(today, { weekStartsOn: 1 }); // Week starts on Monday
        endDate = endOfWeek(today, { weekStartsOn: 1 });
        intervalFunction = eachDayOfInterval;
        formatFunc = (date) => format(date, "yyyy-MM-dd");
        break;
      case 'month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        intervalFunction = eachDayOfInterval;
        formatFunc = (date) => format(date, "yyyy-MM-dd");
        break;
      case 'day':
      default:
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        intervalFunction = eachHourOfInterval;
        formatFunc = (date) => format(date, "yyyy-MM-dd'T'HH:mm:ss");
        break;
    }

    // Generate all intervals in the period
    const intervals = intervalFunction({ start: startDate, end: endDate });

    // Find all todos (optionally filtered by category)
    let todoQuery = {};
    if (category !== 'all') {
      todoQuery.category = category;
    }
    const todos = await Todo.find(todoQuery);
    
    // Initialize result array with all intervals
    const trendData = intervals.map(interval => {
      // For each interval (day or hour), create a time range
      let intervalStart, intervalEnd;
      
      if (period === 'day') {
        // For daily view, each interval is an hour
        intervalStart = interval;
        intervalEnd = addHours(interval, 1);
      } else {
        // For weekly or monthly view, each interval is a day
        intervalStart = startOfDay(interval);
        intervalEnd = endOfDay(interval);
      }
      
      return {
        date: formatFunc(interval),
        intervalStart,
        intervalEnd,
        completedTasks: 0,
        totalPossibleTasks: todos.length,
        percentage: 0
      };
    });

    // Get all daily completions for the period
    const dailyCompletions = await DailyCompletion.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('completedTodos');

    // Process completions and update trend data
    dailyCompletions.forEach(completion => {
      // Find the corresponding interval
      const matchingInterval = trendData.find(interval => 
        completion.date >= interval.intervalStart && 
        completion.date <= interval.intervalEnd
      );
      
      if (matchingInterval) {
        // Filter completedTodos if category is specified
        const relevantCompletedTodos = category === 'all' 
          ? completion.completedTodos 
          : completion.completedTodos.filter(todo => todo.category === category);
        
        // Update completed tasks count
        matchingInterval.completedTasks = relevantCompletedTodos.length;
        
        // Calculate percentage
        matchingInterval.percentage = matchingInterval.totalPossibleTasks > 0
          ? Math.round((matchingInterval.completedTasks / matchingInterval.totalPossibleTasks) * 100)
          : 0;
      }
    });

    // Format the final response data
    const formattedData = trendData.map(({ date, completedTasks, totalPossibleTasks, percentage }) => ({
      date,
      completedTasks,
      totalPossibleTasks,
      percentage
    }));

    return res.status(200).json(formattedData);
  } catch (error) {
    console.error('Error fetching progress trend data:', error);
    return res.status(500).json({ error: 'Failed to fetch progress trend data' });
  }
};

export default connectToMongo(handler);
