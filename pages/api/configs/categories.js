// pages/api/config/categories.js
import connectToMongo from '@/middleware/connectToMongo';
import Config from '@/models/Config';

const handler = async (req, res) => {
  if (req.method === 'POST') {
    const { category } = req.body;

    if (!category || typeof category !== 'string') {
      return res.status(400).json({ message: 'Invalid category' });
    }

    try {
      let config = await Config.findOne();
      if (!config) {
        config = new Config();
      }

      if (config.categories.includes(category)) {
        return res.status(400).json({ message: 'Category already exists' });
      }

      config.categories.push(category);
      await config.save();

      res.status(200).json({ message: 'Category added successfully', categories: config.categories });
    } catch (error) {
      res.status(500).json({ message: 'Error adding category', error });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
};

export default connectToMongo(handler);
