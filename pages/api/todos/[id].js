// pages/api/todos/[id].js
import connectToMongo from '@/middleware/connectToMongo';
import Todo from '@/models/Todo';
import { getUserId } from '@/middleware/clerkAuth';
import { encryptFields, decryptFields, ENCRYPTED_FIELDS } from '@/utils/encryption';

const handler = async (req, res) => {
  const { id } = req.query;
  
  if (req.method === 'PUT') {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
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

      const todo = await Todo.findOne({ _id: id, userId });

      if (!todo) {
        return res.status(404).json({ message: 'Todo not found or access denied' });
      }

      if (priority < 1) {
        return res.status(400).json({ message: 'Priority must be at least 1' });
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

      // Adjust priorities if changed
      if (priority !== todo.priority) {
        if (priority < todo.priority) {
          // Shifting todos down
          await Todo.updateMany({ 
            userId,
            priority: { $gte: priority, $lt: todo.priority } 
          }, { $inc: { priority: 1 } });
        } else {
          // Shifting todos up
          await Todo.updateMany({ 
            userId,
            priority: { $gt: todo.priority, $lte: priority } 
          }, { $inc: { priority: -1 } });
        }
      }

      // Prepare data for encryption
      const updateData = {
        title: title.trim(),
        category: category.trim(),
        difficulty, 
        score, 
        priority 
      };

      // Encrypt sensitive fields
      const encryptedData = encryptFields(updateData, ENCRYPTED_FIELDS.TODO, userId);

      const updatedTodo = await Todo.findByIdAndUpdate(id, encryptedData, { new: true });
      
      // Decrypt before sending back to client
      const decryptedTodo = decryptFields(updatedTodo, ENCRYPTED_FIELDS.TODO, userId);
      
      res.status(200).json(decryptedTodo);
    } catch (error) {
      console.error('Error updating todo:', error);
      res.status(500).json({ message: 'Error updating todo', error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const todo = await Todo.findOne({ _id: id, userId });
      if (!todo) {
        return res.status(404).json({ message: 'Todo not found or access denied' });
      }

      await Todo.deleteOne({ _id: id });
      
      // Adjust priorities of remaining todos
      await Todo.updateMany({ 
        userId,
        priority: { $gt: todo.priority } 
      }, { $inc: { priority: -1 } });
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting todo:', error);
      res.status(500).json({ message: 'Error deleting todo', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
};

export default connectToMongo(handler);
