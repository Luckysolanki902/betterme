// pages/api/planner/[id].js
import connectToMongo from '@/middleware/connectToMongo';
import PlannerPage from '@/models/PlannerPage';
import mongoose from 'mongoose';
const { encryptFields, decryptFields, decryptArray, encryptData, decryptData, ENCRYPTED_FIELDS } = require('@/utils/encryption');
const { getUserId } = require('@/middleware/encryption');

// API handler for /api/planner/[id] - CRUD operations for a specific page
const handler = async (req, res) => {
  const { id } = req.query;
  
  // Validate the ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid page ID format' });
  }

  switch (req.method) {    case 'GET':
      try {
        const userId = getUserId(req);
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
          try {
          // Convert to plain object
          const pageObject = page.toObject ? page.toObject() : page;
          
          // Decrypt title and description
          const decryptedBasicFields = decryptFields(pageObject, ['title', 'description'], userId);
          
          // Create a decrypted page with base fields
          const decryptedPage = {
            ...decryptedBasicFields,
            content: []
          };
          
          // Decrypt child pages if present
          if (decryptedPage.childPages && decryptedPage.childPages.length > 0) {
            decryptedPage.childPages = decryptArray(decryptedPage.childPages, ['title', 'description'], userId);
          }
          
          // Handle content blocks separately
          if (Array.isArray(pageObject.content)) {
            decryptedPage.content = pageObject.content.map(block => {
              // Convert to plain object if it's a Mongoose doc
              const blockObj = block.toObject ? block.toObject() : { ...block };
              
              // Decrypt the block's content
              if (blockObj.content) {
                try {
                  blockObj.content = decryptData(blockObj.content, userId);
                } catch (err) {
                  console.warn('Error decrypting content block:', err);
                }
              }
              
              // Process list items if present
              if (Array.isArray(blockObj.listItems)) {
                blockObj.listItems = blockObj.listItems.map(item => {
                  const itemObj = item.toObject ? item.toObject() : { ...item };
                  
                  // Decrypt item content
                  if (itemObj.content) {
                    try {
                      itemObj.content = decryptData(itemObj.content, userId);
                    } catch (err) {
                      console.warn('Error decrypting list item:', err);
                    }
                  }
                  
                  // Process sub-items
                  if (Array.isArray(itemObj.subItems)) {
                    itemObj.subItems = itemObj.subItems.map(subItem => {
                      const subItemObj = subItem.toObject ? subItem.toObject() : { ...subItem };
                      
                      if (subItemObj.content) {
                        try {
                          subItemObj.content = decryptData(subItemObj.content, userId);
                        } catch (err) {
                          console.warn('Error decrypting sub-item:', err);
                        }
                      }
                      
                      return subItemObj;
                    });
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
      }      case 'PUT':
      try {
        const userId = getUserId(req);
        const { title, description, content } = req.body;
        
        if (!title) {
          return res.status(400).json({ error: 'Title is required' });
        }
        
        // Encrypt title and description
        const encryptedData = encryptFields({ 
          title, 
          description
        }, ['title', 'description'], userId);
        
        // For content blocks, encrypt each block's content separately
        // This maintains the array structure needed by the schema
        let encryptedContent = [];
        if (Array.isArray(content)) {
          encryptedContent = content.map(block => {
            const encryptedBlock = { ...block };
            if (block.content) {
              encryptedBlock.content = encryptData(block.content, userId);
            }
            
            // Encrypt list items if present
            if (Array.isArray(block.listItems)) {
              encryptedBlock.listItems = block.listItems.map(item => {
                const encryptedItem = { ...item };
                if (item.content) {
                  encryptedItem.content = encryptData(item.content, userId);
                }
                
                // Encrypt sub-items if present
                if (Array.isArray(item.subItems)) {
                  encryptedItem.subItems = item.subItems.map(subItem => {
                    const encryptedSubItem = { ...subItem };
                    if (subItem.content) {
                      encryptedSubItem.content = encryptData(subItem.content, userId);
                    }
                    return encryptedSubItem;
                  });
                }
                
                return encryptedItem;
              });
            }
            
            return encryptedBlock;
          });
        }
        
        // Update the page
        const updatedPage = await PlannerPage.findByIdAndUpdate(
          id,
          {
            ...encryptedData,
            content: encryptedContent
          },
          { new: true }
        );
        
        if (!updatedPage) {
          return res.status(404).json({ error: 'Page not found' });
        }
        
        try {
          // Manually decrypt the content blocks to return to client
          const decryptedContent = updatedPage.content?.map(block => {
            const decryptedBlock = { ...block.toObject() };
            
            // Decrypt block content
            if (decryptedBlock.content) {
              try {
                decryptedBlock.content = decryptData(decryptedBlock.content, userId);
              } catch (err) {
                console.warn('Error decrypting block content:', err);
              }
            }
            
            // Decrypt list items if present
            if (Array.isArray(decryptedBlock.listItems)) {
              decryptedBlock.listItems = decryptedBlock.listItems.map(item => {
                const decryptedItem = { ...item };
                if (item.content) {
                  try {
                    decryptedItem.content = decryptData(item.content, userId);
                  } catch (err) {
                    console.warn('Error decrypting list item content:', err);
                  }
                }
                
                // Decrypt sub-items if present
                if (Array.isArray(item.subItems)) {
                  decryptedItem.subItems = item.subItems.map(subItem => {
                    const decryptedSubItem = { ...subItem };
                    if (subItem.content) {
                      try {
                        decryptedSubItem.content = decryptData(subItem.content, userId);
                      } catch (err) {
                        console.warn('Error decrypting sub-item content:', err);
                      }
                    }
                    return decryptedSubItem;
                  });
                }
                
                return decryptedItem;
              });
            }
            
            return decryptedBlock;
          });
          
          // Return decrypted version for response
          const decryptedPage = {
            ...updatedPage.toObject(),
            title,
            description,
            content: decryptedContent || []
          };
          
          return res.status(200).json(decryptedPage);
        } catch (decryptError) {
          console.error('Error creating decrypted response:', decryptError);
          
          // Return basic data if decryption fails
          return res.status(200).json({
            _id: updatedPage._id,
            title: title,
            description: description,
            parentId: updatedPage.parentId,
            childPages: updatedPage.childPages,
            isStatic: updatedPage.isStatic,
            createdAt: updatedPage.createdAt,
            updatedAt: updatedPage.updatedAt
          });
        }
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
