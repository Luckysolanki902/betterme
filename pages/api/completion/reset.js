// /pages/api/completion/reset.js

import connectToMongo from '@/middleware/connectToMongo';
import DailyCompletion from '@/models/DailyCompletion';
import Config from '@/models/Config';

const handler = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // Delete all daily completion records but keep todos intact
      await DailyCompletion.deleteMany({});
      
      // Reset total percentage in Config
      await Config.findOneAndUpdate(
        {}, // Find first document (there should be only one)
        { totalPercentage: 0 }, // Reset total percentage
        { new: true }
      );

      return res.status(200).json({ message: 'Todo progress reset successfully' });
    } catch (error) {
      console.error('Error during todo progress reset:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
