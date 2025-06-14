// pages/api/configs/index.js
import connectToMongo from '@/middleware/connectToMongo';
import Config from '@/models/Config';

const handler = async (req, res) => {
  // GET request to fetch the config
  if (req.method === 'GET') {
    try {
      let config = await Config.findOne();
      
      // If no config exists, create one with default values
      if (!config) {
        config = new Config({
          totalPercentage: 0,
          startDate: new Date()
        });
        await config.save();
      }
      
      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching config', error });
    }
  } 
  // PUT request to update the config
  else if (req.method === 'PUT') {
    try {
      const { startDate, totalPercentage } = req.body;
      
      // Find the config and update it
      const updatedConfig = await Config.findOneAndUpdate(
        {}, // Find the first document (there should be only one)
        { 
          ...(startDate && { startDate }),
          ...(totalPercentage !== undefined && { totalPercentage })
        },
        { 
          new: true, // Return the updated document
          upsert: true // Create if it doesn't exist
        }
      );
      
      res.status(200).json(updatedConfig);
    } catch (error) {
      console.error('Error updating config:', error);
      res.status(500).json({ error: 'Failed to update config' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
};

export default connectToMongo(handler);
