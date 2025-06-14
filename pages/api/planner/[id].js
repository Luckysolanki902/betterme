// pages/api/planner/[id].js
import connectToMongo from '@/middleware/connectToMongo';
import PlannerPage from '@/models/PlannerPage';
import mongoose from 'mongoose';

// API handler for /api/planner/[id] - CRUD operations for a specific page
const handler = async (req, res) => {
  const { id } = req.query;
  
  // Validate the ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid page ID format' });
  }

  switch (req.method) {
    case 'GET':
      try {
        // Get the page with its content
        const page = await PlannerPage.findById(id)
          .populate({
            path: 'childPages',
            select: 'title description isStatic',
            options: { sort: { position: 1 } }
          });
          
        if (!page) {
          return res.status(404).json({ error: 'Page not found' });
        }
        
        return res.status(200).json(page);
      } catch (error) {
        console.error(`Error fetching page ${id}:`, error);
        return res.status(500).json({ error: 'Failed to fetch page' });
      }
    
    case 'PUT':
      try {
        const { title, description, content } = req.body;
        
        if (!title) {
          return res.status(400).json({ error: 'Title is required' });
        }
        
        // Update the page
        const updatedPage = await PlannerPage.findByIdAndUpdate(
          id,
          { 
            title, 
            description, 
            content: content || [] 
          },
          { new: true }
        );
        
        if (!updatedPage) {
          return res.status(404).json({ error: 'Page not found' });
        }
        
        return res.status(200).json(updatedPage);
      } catch (error) {
        console.error(`Error updating page ${id}:`, error);
        return res.status(500).json({ error: 'Failed to update page' });
      }
    
    case 'DELETE':
      try {
        const page = await PlannerPage.findById(id);
        
        if (!page) {
          return res.status(404).json({ error: 'Page not found' });
        }
        
        // First, recursively delete all child pages
        async function deleteChildPages(parentId) {
          const childPages = await PlannerPage.find({ parentId });
          
          for (const childPage of childPages) {
            await deleteChildPages(childPage._id);
            await PlannerPage.findByIdAndDelete(childPage._id);
          }
        }
        
        await deleteChildPages(id);
        
        // If this page has a parent, remove it from the parent's childPages
        if (page.parentId) {
          await PlannerPage.findByIdAndUpdate(
            page.parentId,
            { $pull: { childPages: id } }
          );
        }
        
        // Now delete the page itself
        await PlannerPage.findByIdAndDelete(id);
        
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error(`Error deleting page ${id}:`, error);
        return res.status(500).json({ error: 'Failed to delete page' });
      }
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
