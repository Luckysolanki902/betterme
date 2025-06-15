// pages/api/todos/index.js
import connectToMongo from '@/middleware/connectToMongo';
import Todo from '@/models/Todo';
const { encryptFields, decryptArray, ENCRYPTED_FIELDS } = require('@/utils/encryption');
const { getUserId } = require('@/middleware/encryption');

const handler = async (req, res) => {  if (req.method === 'GET') {
    try {
      const userId = getUserId(req);
      const todos = await Todo.find({}).sort({ priority: 1 });
      
      // Defensive check for todos data
      if (!todos || !Array.isArray(todos)) {
        console.error('Invalid todos data returned from database:', todos);
        return res.status(200).json([]); // Return empty array instead of failing
      }
      
      try {
        // Decrypt todos before sending to client
        const decryptedTodos = decryptArray(todos, ENCRYPTED_FIELDS.TODO, userId);
        res.status(200).json(decryptedTodos || []);
      } catch (decryptError) {
        console.error('Error decrypting todos:', decryptError);
        // If decryption fails, send back the original todos without sensitive fields
        const safeFields = todos.map(todo => {
          const safeTodo = { ...todo.toObject() };
          (ENCRYPTED_FIELDS.TODO || []).forEach(field => delete safeTodo[field]);
          return safeTodo;
        });
        res.status(200).json(safeFields);
      }
    } catch (error) {
      console.error('Error in todos GET endpoint:', error);
      res.status(500).json({ message: 'Error fetching todos', error: error.message });
    }} else if (req.method === 'POST') {
    try {
      const userId = getUserId(req);
      const { title, difficulty, priority, category } = req.body;

      if (!category) {
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

      const existingTodos = await Todo.find({});
      const maxPriority = existingTodos.length ? Math.max(...existingTodos.map(todo => todo.priority)) : 0;

      if (priority > maxPriority + 1) {
        return res.status(400).json({ message: `Priority must be between 1 and ${maxPriority + 1}` });
      }

      if (priority < 1 || priority > maxPriority + 1) {
        return res.status(400).json({ message: 'Priority must be at least 1 and at most n+1' });
      }

      // Shift existing todos if necessary
      if (priority <= maxPriority) {
        await Todo.updateMany({ priority: { $gte: priority } }, { $inc: { priority: 1 } });
      }

      // Encrypt sensitive fields before saving
      const encryptedData = encryptFields({ title, category }, ENCRYPTED_FIELDS.TODO, userId);
      
      const newTodo = new Todo({ 
        ...encryptedData,
        difficulty, 
        score, 
        priority 
      });
      await newTodo.save();
      
      // Decrypt before sending response
      const decryptedTodo = {
        ...newTodo.toObject(),
        title,
        category
      };
      
      res.status(201).json(decryptedTodo);
    } catch (error) {
      res.status(500).json({ message: 'Error creating todo', error });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
};

export default connectToMongo(handler);
