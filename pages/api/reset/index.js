// /pages/api/reset.js

import connectToMongo from '@/middleware/connectToMongo';
import Config from '@/models/Config';
import MonthlyCelibacyRecord from '@/models/MonthlyCelibacyRecord';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      // Delete all existing MonthlyCelibacyRecord documents
      await MonthlyCelibacyRecord.deleteMany({});
      
      // Delete all existing Config documents
      await Config.deleteMany({});

      // Create a new Config document with today's date and totalPercentage set to 0
      const newConfig = new Config({
        totalPercentage: 0,
        startDate: new Date(), // Sets the startDate to the current date and time
        // categories will use the default value defined in the schema
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
