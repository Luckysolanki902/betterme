import connectToMongo from '@/middleware/connectToMongo';
import DailyCompletion from '@/models/DailyCompletion';
import Todo from '@/models/Todo';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    // Set the start date to July 23, 2024
    const start = new Date('2024-07-23T00:00:00Z');
    // Set the end date to today
    const end = new Date();

    try {
      // Fetch all daily completions between the start and end dates
      const dailyCompletions = await DailyCompletion.find({
        date: { $gte: start, $lte: end },
      });

      // Initialize a map to store the count of completions for each todo
      const todoCompletionCount = {};

      // Iterate through each daily completion
      dailyCompletions.forEach(dc => {
        dc.completedTodos.forEach(todoId => {
          // Increment the count for each completed todo
          todoCompletionCount[todoId] = (todoCompletionCount[todoId] || 0) + 1;
        });
      });

      // Fetch all todos to get their titles
      const todos = await Todo.find({});

      // Map the todo completion counts to their titles and ids
      const result = todos.map(todo => ({
        id: todo._id.toString(), // Ensure _id is in string format
        title: todo.title,
        completionCount: todoCompletionCount[todo._id] || 0,
      }));

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching daily completions:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
