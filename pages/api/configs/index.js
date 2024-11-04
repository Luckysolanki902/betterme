// pages/api/config/index.js
import connectToMongo from '@/middleware/connectToMongo';
import Config from '@/models/Config';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      let config = await Config.findOne();
      if (!config) {
        config = new Config();
        await config.save();
      }
      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching config', error });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
};

export default connectToMongo(handler);
