// pages/api/todos/index.js
import connectToMongo from '@/middleware/connectToMongo';
import Todo from '@/models/Todo';
import { getUserId } from '@/middleware/clerkAuth';
import { encryptFields, decryptArray, decryptFields, ENCRYPTED_FIELDS } from '@/utils/encryption';

// Cache for 4 hours since you use once a day
export const revalidate = 14400; // 4 hours

// Enhanced caching system
class TodoCache {
  constructor() {
    this.cache = new Map();
    this.TTL = 4 * 60 * 60 * 1000; // 4 hours
  }

  getKey(userId, type = 'todos') {
    return `${type}-${userId}`;
  }

  get(userId, type = 'todos') {
    const key = this.getKey(userId, type);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      console.log(`Cache hit for ${type}:`, userId.substring(0, 8));
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  set(userId, data, type = 'todos') {
    const key = this.getKey(userId, type);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`Cached ${type} for user:`, userId.substring(0, 8));
  }

  invalidate(userId, type = null) {
    if (type) {
      const key = this.getKey(userId, type);
      this.cache.delete(key);
      console.log(`Invalidated cache for ${type}:`, userId.substring(0, 8));
    } else {
      // Invalidate all cache for user
      for (const key of this.cache.keys()) {
        if (key.includes(userId)) {
          this.cache.delete(key);
        }
      }
      console.log(`Invalidated all cache for user:`, userId.substring(0, 8));
    }
  }
}

const todoCache = new TodoCache();

const handler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const userId = getUserId(req);
      if (!userId) {
        console.error('No userId found in request');
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Check cache first
      const cachedTodos = todoCache.get(userId, 'todos');
      if (cachedTodos) {
        return res.status(200).json(cachedTodos);
      }

      console.log(`Fetching todos for user: ${userId}`);
      
      // Optimized query with lean() and specific field selection
      const todos = await Todo.find({ userId })
        .select('title category difficulty score priority completed createdAt updatedAt')
        .sort({ priority: 1 })
        .lean(); // Much faster, returns plain JS objects
      
      console.log(`Found ${todos.length} todos for user ${userId}`);
      
      // Decrypt the todos before sending to client
      const decryptedTodos = decryptArray(todos, ENCRYPTED_FIELDS.TODO, userId);
      console.log(`Returning ${decryptedTodos?.length || 0} decrypted todos`);
      
      // Cache the result for next time
      todoCache.set(userId, decryptedTodos || [], 'todos');
      
      res.status(200).json(decryptedTodos || []);
    } catch (error) {
      console.error('Error in todos GET endpoint:', error);
      res.status(500).json({ message: 'Error fetching todos', error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { title, difficulty, priority, category } = req.body;

      // Validation
      if (!title?.trim()) {
        return res.status(400).json({ message: 'Title is required' });
      }

      if (!category?.trim()) {
        return res.status(400).json({ message: 'Category is required' });
      }
      
      if (!difficulty) {
        return res.status(400).json({ message: 'Difficulty is required' });
      }
      
      // Calculate score based on difficulty
      let score;
      switch (difficulty) {
        case 'easy':
          score = 1;
          break;
        case 'light':
          score = 3;
          break;
        case 'medium':
          score = 5;
          break;
        case 'challenging':
          score = 7;
          break;
        case 'hard':
          score = 10;
          break;
        default:
          score = 5; // Default to medium if somehow not specified
      }

      const existingTodos = await Todo.find({ userId });
      const maxPriority = existingTodos.length ? Math.max(...existingTodos.map(todo => todo.priority)) : 0;

      // Handle priority logic
      let finalPriority = priority;
      if (!priority || priority < 1) {
        finalPriority = maxPriority + 1; // Add to end if no priority specified
      } else if (priority > maxPriority + 1) {
        finalPriority = maxPriority + 1; // Can't exceed max + 1
      }

      // Shift existing todos if necessary
      if (finalPriority <= maxPriority) {
        await Todo.updateMany({ 
          userId,
          priority: { $gte: finalPriority } 
        }, { 
          $inc: { priority: 1 } 
        });
      }

      // Encrypt sensitive fields before saving
      const todoData = {
        userId,
        title: title.trim(),
        category: category.trim(),
        difficulty, 
        score, 
        priority: finalPriority 
      };

      const encryptedTodoData = encryptFields(todoData, ENCRYPTED_FIELDS.TODO, userId);
      
      const newTodo = new Todo(encryptedTodoData);
      await newTodo.save();
      
      // Invalidate cache since we added a new todo
      todoCache.invalidate(userId);
      
      // Decrypt before sending back to client
      const decryptedTodo = decryptFields(newTodo, ENCRYPTED_FIELDS.TODO, userId);
      
      res.status(201).json(decryptedTodo);
    } catch (error) {
      console.error('Error creating todo:', error);
      res.status(500).json({ message: 'Error creating todo', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
};

export default connectToMongo(handler);
