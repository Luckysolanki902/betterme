// pages/api/planner/[id].js
import connectToMongo from '@/middleware/connectToMongo';
import PlannerPage from '@/models/PlannerPage';
import mongoose from 'mongoose';
import { getUserId } from '@/middleware/clerkAuth';
import { encryptFields, decryptFields, ENCRYPTED_FIELDS } from '@/utils/encryption';

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
        const userId = getUserId(req);
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Get the page with its content
        const page = await PlannerPage.findOne({ _id: id, userId })
          .populate({
            path: 'childPages',
            select: 'title description isStatic',
            options: { sort: { position: 1 } }
          });
          
        if (!page) {
          return res.status(404).json({ error: 'Page not found' });
        }
        
        try {
          // Decrypt the page data
          const decryptedPage = decryptFields(page.toObject(), ENCRYPTED_FIELDS.PLANNER, userId);
          
          // If content exists and is an array, decrypt each block's content
          if (decryptedPage.content && Array.isArray(decryptedPage.content)) {
            decryptedPage.content = decryptedPage.content.map(block => {
              const blockObj = { ...block };
              
              // Decrypt block content if it exists
              if (blockObj.content) {
                try {
                  blockObj.content = decryptFields({ content: blockObj.content }, ['content'], userId).content;
                } catch (err) {
                  console.error('Error decrypting block content:', err);
                  blockObj.content = blockObj.content; // Keep original if decryption fails
                }
              }
              
              // If block has items (like lists), decrypt each item
              if (blockObj.items && Array.isArray(blockObj.items)) {
                blockObj.items = blockObj.items.map(item => {
                  const itemObj = { ...item };
                  if (itemObj.content) {
                    try {
                      itemObj.content = decryptFields({ content: itemObj.content }, ['content'], userId).content;
                    } catch (err) {
                      console.error('Error decrypting item content:', err);
                      itemObj.content = itemObj.content; // Keep original if decryption fails
                    }
                  }
                  return itemObj;
                });
              }
              
              return blockObj;
            });
          }
          
          return res.status(200).json(decryptedPage);
        } catch (decryptError) {
          console.error('Error decrypting planner page:', decryptError);
          
          // Return a safe version with minimal data if decryption fails
          const safePage = {
            _id: page._id,
            isStatic: page.isStatic,
            createdAt: page.createdAt,
            updatedAt: page.updatedAt,
            title: '[Encrypted Page]',
            description: '',
            content: [],
            childPages: (page.childPages || []).map(child => ({
              _id: child._id,
              isStatic: child.isStatic
            }))
          };
          return res.status(200).json(safePage);
        }
      } catch (error) {
        console.error('Error fetching planner page:', error);
        return res.status(500).json({ error: 'Failed to fetch planner page' });
      }
      break;
      
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
        
        // Prepare data for encryption
        let updateData = { title, description };
        
        // If content is provided, encrypt it
        if (content) {
          updateData.content = content.map(block => {
            const blockObj = { ...block };
            
            // Encrypt block content if it exists
            if (blockObj.content) {
              try {
                blockObj.content = encryptFields({ content: blockObj.content }, ['content'], userId).content;
              } catch (err) {
                console.error('Error encrypting block content:', err);
                // Keep original content if encryption fails
              }
            }
            
            // If block has items (like lists), encrypt each item
            if (blockObj.items && Array.isArray(blockObj.items)) {
              blockObj.items = blockObj.items.map(item => {
                const itemObj = { ...item };
                if (itemObj.content) {
                  try {
                    itemObj.content = encryptFields({ content: itemObj.content }, ['content'], userId).content;
                  } catch (err) {
                    console.error('Error encrypting item content:', err);
                    // Keep original content if encryption fails
                  }
                }
                return itemObj;
              });
            }
            
            return blockObj;
          });
        }
        
        // Encrypt title and description
        updateData = encryptFields(updateData, ENCRYPTED_FIELDS.PLANNER, userId);
        
        // Update the page
        const updatedPage = await PlannerPage.findOneAndUpdate(
          { _id: id, userId },
          {
            ...updateData,
            updatedAt: new Date()
          },
          { new: true, runValidators: true }
        );
        
        if (!updatedPage) {
          return res.status(404).json({ error: 'Page not found' });
        }
        
        // Return decrypted version
        const decryptedPage = decryptFields(updatedPage.toObject(), ENCRYPTED_FIELDS.PLANNER, userId);
        res.status(200).json(decryptedPage);
      } catch (error) {
        console.error('Error updating planner page:', error);
        return res.status(500).json({ error: 'Failed to update planner page' });
      }
      break;
      
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
        
        // Recursively delete child pages
        async function deleteChildPages(parentId) {
          const childPages = await PlannerPage.find({ parentId, userId });
          for (const child of childPages) {
            await deleteChildPages(child._id);
            await PlannerPage.deleteOne({ _id: child._id });
          }
        }
        
        // Delete all child pages first
        await deleteChildPages(id);
        
        // Delete the main page
        await PlannerPage.deleteOne({ _id: id, userId });
        
        res.status(200).json({ success: true, message: 'Page and all child pages deleted successfully' });
      } catch (error) {
        console.error('Error deleting planner page:', error);
        return res.status(500).json({ error: 'Failed to delete planner page' });
      }
      break;
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
