// /pages/api/reset.js

import connectToMongo from '@/middleware/connectToMongo';
import Config from '@/models/Config';
import DailyCompletion from '@/models/DailyCompletion';
import Todo from '@/models/Todo';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      // Delete all existing DailyCompletion documents
      await DailyCompletion.deleteMany({});
      
      // Reset completion status for all todos
      await Todo.updateMany({}, { completed: false });
      
      // Delete all existing Config documents
      await Config.deleteMany({});

      // Create a new Config document with initial values
      const newConfig = new Config({
        totalScore: 0,
        totalPossibleScore: 0,
        startDate: new Date(),
        scoresByDay: new Map(),
      });

      // Save the new Config document to the database
      await newConfig.save();

      return res.status(200).json({ message: 'Reset successfully completed', config: newConfig });
    } catch (error) {
      console.error('Error during reset:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
