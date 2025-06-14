// pages/api/planner/index.js
import connectToMongo from '@/middleware/connectToMongo';
import PlannerPage from '@/models/PlannerPage';

// API handler for /api/planner - Gets all root level pages or creates a new page
const handler = async (req, res) => {
  switch (req.method) {
    case 'GET':      try {
        // Get all top-level pages (those with no parentId) that are not embedded
        const pages = await PlannerPage.find({ 
          parentId: null,
          isEmbedded: { $ne: true } // Exclude embedded pages
        })
          .sort({ position: 1, createdAt: -1 })
          .select('title description isStatic childPages');
        
        return res.status(200).json(pages);
      } catch (error) {
        console.error('Error fetching planner pages:', error);
        return res.status(500).json({ error: 'Failed to fetch planner pages' });
      }
    
    case 'POST':
      try {
        // Create a new page
        const { title, description, parentId, isStatic, content = [] } = req.body;
        
        if (!title) {
          return res.status(400).json({ error: 'Title is required' });
        }
        
        // Create the new page
        const newPage = new PlannerPage({
          title,
          description,
          parentId,
          isStatic: isStatic || false,
          content,
        });
        
        const savedPage = await newPage.save();
        
        // If this page has a parent, add it to the parent's childPages
        if (parentId) {
          await PlannerPage.findByIdAndUpdate(
            parentId,
            { $push: { childPages: savedPage._id } }
          );
        }
        
        return res.status(201).json(savedPage);
      } catch (error) {
        console.error('Error creating planner page:', error);
        return res.status(500).json({ error: 'Failed to create planner page' });
      }
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
