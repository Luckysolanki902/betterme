import connectToMongo from '@/middleware/connectToMongo';
import Level from '@/models/Level';

const handler = async (req, res) => {
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { levelName, improvedPercentage } = req.body;
    const updatedLevel = await Level.findByIdAndUpdate(
      id,
      { levelName, improvedPercentage },
      { new: true }
    );

    if (!updatedLevel) {
      return res.status(404).json({ error: 'Level not found' });
    }
    return res.status(200).json(updatedLevel);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
