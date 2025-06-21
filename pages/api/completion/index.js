// pages/api/completion/index.js
import connectToMongo from '@/middleware/connectToMongo';
import DailyCompletion from '@/models/DailyCompletion';
import Config from '@/models/Config';
import Todo from '@/models/Todo';
import { getUserId } from '@/middleware/clerkAuth';
import { decryptArray, decryptFields, ENCRYPTED_FIELDS } from '@/utils/encryption';
import { format, startOfDay, parseISO } from 'date-fns';

/**
 * API handler for marking todos as complete/incomplete
 * This endpoint maintains the DailyCompletion records that are used
 * for tracking progress and generating statistics
 */
const handler = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { todoId, date } = req.body;
      
      if (!todoId) {
        return res.status(400).json({ error: 'Todo ID is required' });
      }
      
      // Use provided date or default to today
      const dateObj = date ? parseISO(date) : new Date();
      const formattedDate = format(dateObj, 'yyyy-MM-dd');
      const dayStart = startOfDay(dateObj);      // Find or create the daily completion record for this date
      // Use findOneAndUpdate with upsert to prevent duplicate key errors
      // We need to be precise with date filtering to avoid timezone issues
      const startOfDayISO = dayStart.toISOString();
      const endOfDay = new Date(dayStart);
      endOfDay.setHours(23, 59, 59, 999);
      const endOfDayISO = endOfDay.toISOString();
      
      let dailyCompletion = await DailyCompletion.findOneAndUpdate(
        { 
          userId,
          date: { $gte: new Date(startOfDayISO), $lte: new Date(endOfDayISO) }
        },
        // If no document exists, this will be the document to create
        {
          $setOnInsert: {
            userId,
            date: dayStart,
            completedTodos: [],
            score: 0,
            totalPossibleScore: 0
          }
        },
        // Options
        {
          new: true, // Return the updated document
          upsert: true, // Create if it doesn't exist
          runValidators: true, // Validate the new document
          setDefaultsOnInsert: true // Apply schema defaults for new documents
        }
      );

      // Find the todo and verify it belongs to the user
      const todo = await Todo.findOne({ _id: todoId, userId });
      if (!todo) {
        return res.status(404).json({ error: 'Todo not found or access denied' });
      }
      
      // Decrypt the todo to get its details
      const decryptedTodo = decryptFields(todo, ENCRYPTED_FIELDS.TODO, userId);
      
      // Calculate score based on todo difficulty
      const todoScore = todo.score || getDifficultyScore(decryptedTodo.difficulty);
      
      // Get all user's todos to calculate total possible score
      const allTodos = await Todo.find({ userId });
      const decryptedAllTodos = decryptArray(allTodos, ENCRYPTED_FIELDS.TODO, userId);
      const totalPossibleScore = decryptedAllTodos.reduce((sum, t) => sum + (t.score || getDifficultyScore(t.difficulty)), 0);
      
      // Update daily completion record
      const isCompleted = dailyCompletion.completedTodos.some(id => id.toString() === todoId);
      
      if (isCompleted) {
        // Remove todo from completedTodos
        dailyCompletion.completedTodos = dailyCompletion.completedTodos?.filter(
          id => id.toString() !== todoId
        );
        dailyCompletion.score = Math.max(0, dailyCompletion.score - todoScore);
      } else {
        // Add todo to completedTodos
        if (!dailyCompletion.completedTodos.includes(todoId)) {
          dailyCompletion.completedTodos.push(todoId);
        }
        dailyCompletion.score += todoScore;
      }
      
      // Update total possible score
      dailyCompletion.totalPossibleScore = totalPossibleScore;
      
      // Save the updated daily completion record
      await dailyCompletion.save();
      
      // Update Config with daily score data
      let config = await Config.findOne({ userId });
      if (!config) {
        config = new Config({
          userId,
          totalScore: 0,
          totalPossibleScore: 0,
          startDate: new Date(),
          scoresByDay: {}
        });
      }
      
      // Update total score by recalculating from all daily completions
      const allDailyCompletions = await DailyCompletion.find({ userId });
      const totalScore = allDailyCompletions.reduce((sum, completion) => sum + (completion.score || 0), 0);
      
      // Update config
      config.totalScore = totalScore;
      config.totalPossibleScore = totalPossibleScore;
      
      // Update scoresByDay map
      const scoresByDay = config.scoresByDay || {};
      scoresByDay[formattedDate] = {
        score: dailyCompletion.score,
        totalPossible: dailyCompletion.totalPossibleScore
      };
      config.scoresByDay = scoresByDay;
      
      // Save the config
      await config.save();
      
      // Get the completion status for each todo (to return to client)
      const allCompletionStatus = await getAllTodosCompletionStatus(userId, dateObj);
      
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
  } else if (req.method === 'GET') {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { date } = req.query;
      const dateObj = date ? parseISO(date) : new Date();
      
      // Get the completion status for all todos
      const allCompletionStatus = await getAllTodosCompletionStatus(userId, dateObj);
      
      return res.status(200).json({
        success: true,
        completedTodos: allCompletionStatus.filter(todo => todo.completed).map(todo => todo._id),
        allCompletionStatus,
        date: format(dateObj, 'yyyy-MM-dd')
      });
    } catch (error) {
      console.error('Error fetching completion status:', error);
      return res.status(500).json({ error: 'Failed to fetch completion status' });
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
async function getAllTodosCompletionStatus(userId, date) {
  const dayStart = startOfDay(date);
  
  // Find completion record for the date
  const dailyCompletion = await DailyCompletion.findOne({
    userId,
    date: { $gte: dayStart, $lt: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000) }
  });
  
  // Get all user's todos
  const allTodos = await Todo.find({ userId });
  
  // Decrypt todos before processing
  const decryptedTodos = decryptArray(allTodos, ENCRYPTED_FIELDS.TODO, userId);
  
  // Map todos to their completion status
  return decryptedTodos.map(todo => ({
    _id: todo._id,
    title: todo.title,
    score: todo.score || getDifficultyScore(todo.difficulty),
    category: todo.category,
    difficulty: todo.difficulty,
    priority: todo.priority,
    completed: dailyCompletion?.completedTodos.some(id => id.toString() === todo._id.toString()) || false
  }));
}

export default connectToMongo(handler);
