// pages/api/todos/index.js
import connectToMongo from '@/middleware/connectToMongo';
import Todo from '@/models/Todo';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const todos = await Todo.find({}).sort({ priority: 1 });
      res.status(200).json(todos);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching todos', error });
    }  } else if (req.method === 'POST') {
    try {
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
      }      const newTodo = new Todo({ title, difficulty, score, priority, category });
      await newTodo.save();
      res.status(201).json(newTodo);
    } catch (error) {
      res.status(500).json({ message: 'Error creating todo', error });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
};

export default connectToMongo(handler);
