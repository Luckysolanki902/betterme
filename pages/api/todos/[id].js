import connectToMongo from '@/middleware/connectToMongo';
import Todo from '@/models/Todo';

const handler = async (req, res) => {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { title, percentage } = req.body;
      const updatedTodo = await Todo.findByIdAndUpdate(id, { title, percentage }, { new: true });
      res.status(200).json(updatedTodo);
    } catch (error) {
      res.status(500).json({ message: 'Error updating todo', error });
    }
  } else if (req.method === 'DELETE') {
    try {
      await Todo.findByIdAndDelete(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting todo', error });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
};

export default connectToMongo(handler);
