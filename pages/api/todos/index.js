// pages/api/todos/index.js
import connectToMongo from '@/middleware/connectToMongo';
import Todo from '@/models/Todo';
import { getUserId } from '@/middleware/clerkAuth';
import { encryptFields, decryptArray, decryptFields, ENCRYPTED_FIELDS } from '@/utils/encryption';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const todos = await Todo.find({ userId }).sort({ priority: 1 });
      
      // Decrypt the todos before sending to client
      const decryptedTodos = decryptArray(todos, ENCRYPTED_FIELDS.TODO, userId);
      
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
