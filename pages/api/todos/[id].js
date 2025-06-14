// pages/api/todos/[id].js
import connectToMongo from '@/middleware/connectToMongo';
import Todo from '@/models/Todo';

const handler = async (req, res) => {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { title, difficulty, priority, category, isColorful } = req.body;

      if (!category) {
        return res.status(400).json({ message: 'Category is required' });
      }

      if (!difficulty) {
        return res.status(400).json({ message: 'Difficulty is required' });
      }

      const todo = await Todo.findById(id);

      if (todo) {
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

        // Adjust priorities
        if (priority !== todo.priority) {
          if (priority < todo.priority) {
            // Shifting todos down
            await Todo.updateMany({ priority: { $gte: priority, $lt: todo.priority } }, { $inc: { priority: 1 } });
          } else {
            // Shifting todos up
            await Todo.updateMany({ priority: { $gt: todo.priority, $lte: priority } }, { $inc: { priority: -1 } });
          }
        }

        const updatedTodo = await Todo.findByIdAndUpdate(id, { title, difficulty, score, priority, category, isColorful }, { new: true });
        res.status(200).json(updatedTodo);
      } else {
        res.status(404).json({ message: 'Todo not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error updating todo', error });
    }
  } else if (req.method === 'DELETE') {
    try {
      const todo = await Todo.findById(id);
      if (todo) {
        await Todo.deleteOne({ _id: id });
        await Todo.updateMany({ priority: { $gt: todo.priority } }, { $inc: { priority: -1 } });
        res.status(204).end();
      } else {
        res.status(404).json({ message: 'Todo not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error deleting todo', error });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
};

export default connectToMongo(handler);
