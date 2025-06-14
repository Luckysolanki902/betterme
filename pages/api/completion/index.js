// pages/api/completion/index.js
import connectToMongo from '@/middleware/connectToMongo';
import DailyCompletion from '@/models/DailyCompletion';
import Config from '@/models/Config';
import Todo from '@/models/Todo';
import { format, startOfDay, parseISO } from 'date-fns';

/**
 * API handler for marking todos as complete/incomplete
 * This endpoint maintains the DailyCompletion records that are used
 * for tracking progress and generating statistics
 */
const handler = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { todoId, date } = req.body;
      
      // Use provided date or default to today
      const dateObj = date ? parseISO(date) : new Date();
      const formattedDate = format(dateObj, 'yyyy-MM-dd');
      const dayStart = startOfDay(dateObj);
      
      // Find or create the daily completion record for this date
      let dailyCompletion = await DailyCompletion.findOne({ 
        date: { $gte: dayStart, $lt: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000) }
      });
      
      if (!dailyCompletion) {
        dailyCompletion = new DailyCompletion({ 
          date: dayStart, 
          completedTodos: [],
          score: 0,
          totalPossibleScore: 0
        });
      }

      // Find the todo
      const todo = await Todo.findById(todoId);
      if (!todo) {
        return res.status(404).json({ error: 'Todo not found' });
      }
      
      // Calculate score based on todo difficulty
      const todoScore = todo.score || getDifficultyScore(todo.difficulty);
      
      // Get all todos to calculate total possible score
      const allTodos = await Todo.find({});
      const totalPossibleScore = allTodos.reduce((sum, t) => sum + (t.score || getDifficultyScore(t.difficulty)), 0);
      
      // Update daily completion record
      const isCompleted = dailyCompletion.completedTodos.some(id => id.toString() === todoId);
      
      if (isCompleted) {
        // Remove todo from completedTodos
        dailyCompletion.completedTodos = dailyCompletion.completedTodos.filter(
          id => id.toString() !== todoId
        );
        dailyCompletion.score -= todoScore;
      } else {
        // Add todo to completedTodos
        dailyCompletion.completedTodos.push(todoId);
        dailyCompletion.score += todoScore;
      }
      
      // Update total possible score
      dailyCompletion.totalPossibleScore = totalPossibleScore;
      
      // Save the updated daily completion record
      await dailyCompletion.save();
      
      // Get the completion status for each todo (to return to client)
      const allCompletionStatus = await getAllTodosCompletionStatus(dateObj);
      
      return res.status(200).json({
        success: true,
        completedTodos: dailyCompletion.completedTodos,
        score: dailyCompletion.score,
        totalPossibleScore: dailyCompletion.totalPossibleScore,
        date: formattedDate,
        allCompletionStatus
      });
    } catch (error) {
      console.error('Error updating completion status:', error);
      return res.status(500).json({ error: 'Failed to update completion status' });
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

/**
 * Get completion status for all todos on a given date
 */
async function getAllTodosCompletionStatus(date) {
  const dayStart = startOfDay(date);
  
  // Find completion record for the date
  const dailyCompletion = await DailyCompletion.findOne({
    date: { $gte: dayStart, $lt: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000) }
  });
  
  // Get all todos
  const allTodos = await Todo.find({});
  
  // Map todos to their completion status
  return allTodos.map(todo => ({
    _id: todo._id,
    title: todo.title,
    score: todo.score || getDifficultyScore(todo.difficulty),
    category: todo.category,
    completed: dailyCompletion?.completedTodos.some(id => id.toString() === todo._id.toString()) || false
  }));
}

export default connectToMongo(handler);
