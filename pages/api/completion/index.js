// pages/api/completion/index.js
import connectToMongo from '@/middleware/connectToMongo';
import DailyCompletion from '@/models/DailyCompletion';
import Config from '@/models/Config';
import Todo from '@/models/Todo';
import { getUserId } from '@/middleware/clerkAuth';
import { decryptArray, decryptFields, ENCRYPTED_FIELDS } from '@/utils/encryption';
import { format, startOfDay, parseISO } from 'date-fns';

// Cache for completion status - shorter TTL since this changes more frequently
export const revalidate = 3600; // 1 hour

// Completion cache system
class CompletionCache {
  constructor() {
    this.cache = new Map();
    this.TTL = 60 * 60 * 1000; // 1 hour for completion status
  }

  getKey(userId, date = null) {
    const dateStr = date ? format(parseISO(date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
    return `completion-${userId}-${dateStr}`;
  }

  get(userId, date = null) {
    const key = this.getKey(userId, date);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      console.log('Cache hit for completion:', userId.substring(0, 8));
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  set(userId, data, date = null) {
    const key = this.getKey(userId, date);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log('Cached completion for user:', userId.substring(0, 8));
  }

  invalidate(userId, date = null) {
    if (date) {
      const key = this.getKey(userId, date);
      this.cache.delete(key);
    } else {
      // Invalidate all completion cache for user
      for (const key of this.cache.keys()) {
        if (key.includes(`completion-${userId}`)) {
          this.cache.delete(key);
        }
      }
    }
    console.log('Invalidated completion cache for user:', userId.substring(0, 8));
  }
}

const completionCache = new CompletionCache();

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
        console.error('No userId found in completion endpoint');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log(`Processing completion request for user: ${userId}`);
      const { todoId, date } = req.body;
      
      if (!todoId) {
        console.error('No todoId provided in completion request');
        return res.status(400).json({ error: 'Todo ID is required' });
      }
      
      console.log(`Processing todo: ${todoId}, date: ${date || 'today'}`);
      
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
      
      // Invalidate completion cache since status changed
      completionCache.invalidate(userId, date);
      
      // Get the completion status for each todo (to return to client)
      const allCompletionStatus = await getAllTodosCompletionStatus(userId, dateObj);
      
      // Cache the new completion status
      const responseData = {
        success: true,
        completedTodos: dailyCompletion.completedTodos,
        score: dailyCompletion.score,
        totalPossibleScore: dailyCompletion.totalPossibleScore,
        date: formattedDate,
        allCompletionStatus
      };
      
      completionCache.set(userId, responseData, date);
      
      return res.status(200).json(responseData);
    } catch (error) {
      console.error('Error updating completion status:', error);
      return res.status(500).json({ error: 'Failed to update completion status' });
    }
  } else if (req.method === 'GET') {
    try {
      const userId = getUserId(req);
      if (!userId) {
        console.error('No userId found in completion GET endpoint');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { date } = req.query;
      const dateObj = date ? parseISO(date) : new Date();
      
      // Check cache first
      const cachedCompletion = completionCache.get(userId, date);
      if (cachedCompletion) {
        return res.status(200).json(cachedCompletion);
      }

      console.log(`Fetching completion status for user: ${userId}`);
      console.log(`Date for completion check: ${format(dateObj, 'yyyy-MM-dd')}`);
      
      // Get the completion status for all todos
      const allCompletionStatus = await getAllTodosCompletionStatus(userId, dateObj);
      console.log(`Found completion status for ${allCompletionStatus?.length || 0} todos`);
      
      const completedTodos = allCompletionStatus?.filter(todo => todo.completed).map(todo => todo._id) || [];
      console.log(`${completedTodos.length} todos are completed`);
      
      const responseData = {
        success: true,
        completedTodos,
        allCompletionStatus,
        date: format(dateObj, 'yyyy-MM-dd')
      };
      
      // Cache the result
      completionCache.set(userId, responseData, date);
      
      return res.status(200).json(responseData);
    } catch (error) {
      console.error('Error fetching completion status:', error);
      return res.status(500).json({ error: 'Failed to fetch completion status', details: error.message });
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
