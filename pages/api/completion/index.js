import connectToMongo from '@/middleware/connectToMongo';
import DailyCompletion from '@/models/DailyCompletion';
import TotalCompletion from '@/models/TotalCompletion';
import Todo from '@/models/Todo';
import { format } from 'date-fns';

const handler = async (req, res) => {
  if (req.method === 'POST') {
    const { todoId } = req.body;
    const today = format(new Date(), 'yyyy-MM-dd');

    let dailyCompletion = await DailyCompletion.findOne({ date: today });
    if (!dailyCompletion) {
      dailyCompletion = new DailyCompletion({ date: today, completedTodos: [], percentage: 0 });
    }

    const todo = await Todo.findById(todoId);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    let totalCompletion = await TotalCompletion.findOne();
    if (!totalCompletion) {
      totalCompletion = new TotalCompletion({ totalPercentage: 0 });
    }

    const isCompleted = dailyCompletion.completedTodos.includes(todoId);
    if (isCompleted) {
      dailyCompletion.completedTodos.pull(todoId);
      dailyCompletion.percentage -= todo.percentage;
      totalCompletion.totalPercentage -= todo.percentage;
    } else {
      dailyCompletion.completedTodos.push(todoId);
      dailyCompletion.percentage += todo.percentage;
      totalCompletion.totalPercentage += todo.percentage;
    }

    await dailyCompletion.save();
    await totalCompletion.save();

    return res.status(200).json({
      completedTodos: dailyCompletion.completedTodos,
      dailyPercentage: dailyCompletion.percentage,
      totalPercentage: totalCompletion.totalPercentage,
    });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
