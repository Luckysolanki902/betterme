import connectToMongo from '@/middleware/connectToMongo';
import TotalCompletion from '@/models/Config';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    const totalCompletion = await TotalCompletion.findOne();
    if (!totalCompletion) {
      return res.status(404).json({ error: 'TotalCompletion not found' });
    }
    return res.status(200).json({ totalPercentage: totalCompletion.totalPercentage });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
