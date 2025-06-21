// pages/api/todos/reset.js
import connectToMongo from '@/middleware/connectToMongo';
import Todo from '@/models/Todo';
import { getUserId } from '@/middleware/clerkAuth';

const handler = async (req, res) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete all todos for this user
    await Todo.deleteMany({ userId });

    return res.status(200).json({ success: true, message: 'All todos deleted successfully' });
  } catch (error) {
    console.error('Error deleting todos:', error);
    return res.status(500).json({ error: 'Failed to delete todos' });
  }
};

export default connectToMongo(handler);
