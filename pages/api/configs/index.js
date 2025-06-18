// pages/api/configs/index.js
import connectToMongo from '@/middleware/connectToMongo';
import Config from '@/models/Config';
import { getUserId } from '@/middleware/clerkAuth';

const handler = async (req, res) => {
  // GET request to fetch the config
  if (req.method === 'GET') {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      let config = await Config.findOne({ userId });
      
      // If no config exists, create one with default values
      if (!config) {
        config = new Config({
          userId,
          totalPercentage: 0,
          totalScore: 0,
          totalPossibleScore: 0,
          startDate: new Date(),
          categories: [
            "Mental & Emotional Wellbeing",
            "Morning Routine",
            "Study & Learning",
            "Discipline & Habits",
            "Social & Communication Skills",
            "Work & Career",
            "Physical Health & Fitness",
            "Recreation & Leisure",
            "Personal Development",
            "Self-Care & Hygiene",
            "Time Management"
          ]
        });
        await config.save();
      }
      
      res.status(200).json(config);
    } catch (error) {
      console.error('Error fetching config:', error);
      res.status(500).json({ message: 'Error fetching config', error: error.message });
    }
  } 
  // PUT request to update the config
  else if (req.method === 'PUT') {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { startDate, totalPercentage, totalScore, totalPossibleScore, categories } = req.body;
      
      // Find the user's config and update it
      const updatedConfig = await Config.findOneAndUpdate(
        { userId }, // Find by userId
        { 
          ...(startDate && { startDate }),
          ...(totalPercentage !== undefined && { totalPercentage }),
          ...(totalScore !== undefined && { totalScore }),
          ...(totalPossibleScore !== undefined && { totalPossibleScore }),
          ...(categories && { categories })
        },
        { 
          new: true, // Return the updated document
          upsert: true, // Create if it doesn't exist
          runValidators: true // Run schema validation
        }
      );
      
      res.status(200).json(updatedConfig);
    } catch (error) {
      console.error('Error updating config:', error);
      res.status(500).json({ message: 'Error updating config', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
};

export default connectToMongo(handler);
