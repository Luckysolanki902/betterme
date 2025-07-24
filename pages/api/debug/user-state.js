// pages/api/debug/user-state.js
import connectToMongo from '@/middleware/connectToMongo';
import Todo from '@/models/Todo';
import DailyCompletion from '@/models/DailyCompletion';
import { getUserId } from '@/middleware/clerkAuth';
import { decryptArray, ENCRYPTED_FIELDS } from '@/utils/encryption';

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`=== DEBUG USER STATE FOR: ${userId} ===`);

    // Get raw todos from database
    const rawTodos = await Todo.find({ userId }).sort({ priority: 1 });
    console.log(`Raw todos found: ${rawTodos.length}`);

    // Try to decrypt todos
    let decryptedTodos = [];
    try {
      decryptedTodos = decryptArray(rawTodos, ENCRYPTED_FIELDS.TODO, userId);
      console.log(`Decrypted todos: ${decryptedTodos?.length || 0}`);
    } catch (decryptError) {
      console.error('Decryption error:', decryptError);
    }

    // Get daily completions
    const completions = await DailyCompletion.find({ userId }).sort({ date: -1 }).limit(5);
    console.log(`Recent completions found: ${completions.length}`);

    // Get today's completion
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const todayCompletion = await DailyCompletion.findOne({
      userId,
      date: { $gte: startOfToday, $lte: endOfToday }
    });

    const debugInfo = {
      userId,
      timestamp: new Date().toISOString(),
      rawTodosCount: rawTodos.length,
      decryptedTodosCount: decryptedTodos?.length || 0,
      recentCompletionsCount: completions.length,
      todayCompletionExists: !!todayCompletion,
      todayCompletedCount: todayCompletion?.completedTodos?.length || 0,
      todayScore: todayCompletion?.score || 0,
      rawTodos: rawTodos.map(todo => ({
        _id: todo._id,
        priority: todo.priority,
        completed: todo.completed,
        hasTitle: !!todo.title,
        hasCategory: !!todo.category,
        createdAt: todo.createdAt
      })),
      decryptedTodos: decryptedTodos?.map(todo => ({
        _id: todo._id,
        title: todo.title?.substring(0, 20) + '...',
        category: todo.category,
        priority: todo.priority,
        score: todo.score
      })) || [],
      completions: completions.map(comp => ({
        date: comp.date,
        completedCount: comp.completedTodos?.length || 0,
        score: comp.score
      }))
    };

    console.log('=== DEBUG INFO ===', JSON.stringify(debugInfo, null, 2));

    return res.status(200).json(debugInfo);

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return res.status(500).json({ 
      error: 'Debug failed', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export default connectToMongo(handler);
