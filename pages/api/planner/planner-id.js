// pages/api/planner/[id].js
import connectToMongo from '@/middleware/connectToMongo';
import PlannerPage from '@/models/PlannerPage';
import mongoose from 'mongoose';
import { getUserId } from '@/middleware/clerkAuth';
import { encryptFields, decryptFields, ENCRYPTED_FIELDS } from '@/utils/encryption';

const handler = async (req, res) => {
  const { id } = req.query;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid page ID format' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const userId = getUserId(req);
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const page = await PlannerPage.findOne({ _id: id, userId });
        if (!page) {
          return res.status(404).json({ error: 'Page not found' });
        }
        
        const decryptedPage = decryptFields(page.toObject(), ENCRYPTED_FIELDS.PLANNER, userId);
        return res.status(200).json(decryptedPage);
      } catch (error) {
        console.error('Error fetching planner page:', error);
        return res.status(500).json({ error: 'Failed to fetch planner page' });
      }
      
    case 'PUT':
      try {
        const userId = getUserId(req);
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const { title, description, content } = req.body;
        if (!title) {
          return res.status(400).json({ error: 'Title is required' });
        }
        
        const updateData = encryptFields({ title, description, content }, ENCRYPTED_FIELDS.PLANNER, userId);
        
        const updatedPage = await PlannerPage.findOneAndUpdate(
          { _id: id, userId },
          { ...updateData, updatedAt: new Date() },
          { new: true, runValidators: true }
        );
        
        if (!updatedPage) {
          return res.status(404).json({ error: 'Page not found' });
        }
        
        const decryptedPage = decryptFields(updatedPage.toObject(), ENCRYPTED_FIELDS.PLANNER, userId);
        res.status(200).json(decryptedPage);
      } catch (error) {
        console.error('Error updating planner page:', error);
        return res.status(500).json({ error: 'Failed to update planner page' });
      }
      
    case 'DELETE':
      try {
        const userId = getUserId(req);
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const page = await PlannerPage.findOne({ _id: id, userId });
        if (!page) {
          return res.status(404).json({ error: 'Page not found' });
        }
        
        await PlannerPage.deleteOne({ _id: id, userId });
        res.status(200).json({ success: true, message: 'Page deleted successfully' });
      } catch (error) {
        console.error('Error deleting planner page:', error);
        return res.status(500).json({ error: 'Failed to delete planner page' });
      }
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
