// @pages/api/todos/[id].js
import connectToMongo from '@/middleware/connectToMongo';
import Todo from '@/models/Todo';

const handler = async (req, res) => {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { title, percentage, priority } = req.body;
      const todo = await Todo.findById(id);

      if (todo) {
        // Adjust priorities
        if (priority !== todo.priority) {
          await Todo.updateMany({ priority: { $gte: Math.min(priority, todo.priority), $lt: Math.max(priority, todo.priority) } }, { $inc: { priority: priority < todo.priority ? 1 : -1 } });
        }
        const updatedTodo = await Todo.findByIdAndUpdate(id, { title, percentage, priority }, { new: true });
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
