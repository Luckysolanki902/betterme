// pages/api/progress/index.js
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
  subDays,
  format,
  differenceInDays
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
    let startDate, endDate;
    switch (period) {
      case 'week':
        startDate = startOfWeek(today, { weekStartsOn: 1 }); // Week starts on Monday
        endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'day':
      default:
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
    }
    
    // Find all relevant todos
    let todoQuery = {};
    if (category !== 'all') {
      todoQuery.category = category;
    }
    const todos = await Todo.find(todoQuery);

    // Get all daily completions for the period
    const dailyCompletions = await DailyCompletion.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('completedTodos');

    // Calculate completion stats
    let completedTasks = 0;
    let totalPossibleTasks = todos.length * (period === 'day' ? 1 : (period === 'week' ? 7 : 30));
    
    // For tracking category stats
    const categoryStats = {};
    const totalByCategory = {};

    // Process each daily completion
    dailyCompletions.forEach(dc => {
      if (dc.completedTodos && dc.completedTodos.length > 0) {
        // Filter by category if needed
        const relevantCompletedTodos = category === 'all' 
          ? dc.completedTodos 
          : dc.completedTodos?.filter(todo => todo.category === category);

        // Add to completed count
        completedTasks += relevantCompletedTodos.length;

        // Update category stats
        relevantCompletedTodos.forEach(todo => {
          const todoCategory = todo.category;
          categoryStats[todoCategory] = (categoryStats[todoCategory] || 0) + 1;
        });
      }
    });

    // Calculate totals by category
    todos.forEach(todo => {
      const todoCategory = todo.category;
      totalByCategory[todoCategory] = (totalByCategory[todoCategory] || 0) + 1;
    });

    // Format category data for charts
    const categoryData = Object.keys(categoryStats).map(catName => {
      const completedInCategory = categoryStats[catName] || 0;
      const totalInCategory = period === 'day' 
        ? (totalByCategory[catName] || 0) 
        : (totalByCategory[catName] || 0) * (period === 'week' ? 7 : 30);
      
      const percentage = totalInCategory > 0 
        ? Math.round((completedInCategory / totalInCategory) * 100) 
        : 0;
        
      return {
        name: catName,
        value: completedInCategory,
        total: totalInCategory,
        percentage
      };
    });

    // Sort categories by completion count
    categoryData.sort((a, b) => b.value - a.value);

    // Calculate completion percentage
    const completionPercentage = totalPossibleTasks > 0 
      ? Math.round((completedTasks / totalPossibleTasks) * 100) 
      : 0;

    // Get streak data (consecutive days with completions)
    const streak = await calculateStreak();

    // Generate insights
    const insights = {
      completedTasks,
      totalPossibleTasks,
      completionPercentage,
      topCategory: categoryData.length > 0 ? categoryData[0].name : 'None',
      streak,
      nextMilestone: generateNextMilestone(completedTasks)
    };

    return res.status(200).json({
      period,
      category,
      insights,
      categoryData,
    });
  } catch (error) {
    console.error('Error fetching progress data:', error);
    return res.status(500).json({ error: 'Failed to fetch progress data' });
  }
};

// Helper function to calculate current streak
async function calculateStreak() {
  const today = new Date();
  let currentStreak = 0;

  // Check up to 100 days back (arbitrary limit)
  for (let i = 0; i < 100; i++) {
    const checkDate = subDays(today, i);
    const startOfCheckDate = startOfDay(checkDate);
    const endOfCheckDate = endOfDay(checkDate);
    
    const completion = await DailyCompletion.findOne({
      date: { $gte: startOfCheckDate, $lte: endOfCheckDate },
      'completedTodos.0': { $exists: true } // Check if completedTodos array is not empty
    });
    
    if (completion) {
      currentStreak = i === 0 ? 1 : currentStreak + 1;
    } else if (i > 0) { // Skip today if no completions
      break;
    }
  }
  
  return currentStreak;
}

// Generate a motivating next milestone message
function generateNextMilestone(completedTasks) {
  const milestones = [5, 10, 25, 50, 100, 250, 500, 1000];
  
  // Find the next milestone above the current completion count
  for (const milestone of milestones) {
    if (completedTasks < milestone) {
      const remaining = milestone - completedTasks;
      return `Complete ${remaining} more tasks to reach ${milestone} total completions!`;
    }
  }
  
  // If above all milestones
  return `Amazing! You've completed over ${milestones[milestones.length - 1]} tasks!`;
}

export default connectToMongo(handler);
