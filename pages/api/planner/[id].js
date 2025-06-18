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
        }        // Decrypt the entire page first to handle standard fields
        const pageObj = page.toObject();
        let decryptedPage = decryptFields(pageObj, ENCRYPTED_FIELDS.PLANNER, userId);
        
        // Additional handling for content blocks if they still appear encrypted
        if (Array.isArray(decryptedPage.content) && decryptedPage.content.length > 0) {
          decryptedPage.content = decryptedPage.content.map(block => {
            const decryptedBlock = { ...block };
              // Decrypt the content field in each block if it still looks encrypted
            if (typeof decryptedBlock.content === 'string' && decryptedBlock.content.trim() !== '') {
              try {
                // If the content still appears to be encrypted
                if (decryptedBlock.content.match(/^[A-Za-z0-9+/=]+$/) && decryptedBlock.content.length > 20) {
                  try {
                    const decryptResult = decryptFields({ text: decryptedBlock.content }, ['text'], userId);
                    if (decryptResult && decryptResult.text) {
                      decryptedBlock.content = decryptResult.text;
                    }
                  } catch (err) {
                    console.warn('Failed to decrypt block content, using as-is:', err);
                    // Keep original content if decryption fails
                  }
                }
                // If not encrypted or decryption failed, keep the original content
              } catch (err) {
                console.error('Error processing block content:', err);
                // Keep encrypted content if decryption fails
              }
            }
            
            // Decrypt list items if present
            if (Array.isArray(decryptedBlock.listItems) && decryptedBlock.listItems.length > 0) {
              decryptedBlock.listItems = decryptedBlock.listItems.map(item => {
                const decryptedItem = { ...item };                if (typeof decryptedItem.content === 'string' && decryptedItem.content.trim() !== '') {
                  try {
                    // First check if the content appears to be encrypted
                    if (decryptedItem.content.match(/^[A-Za-z0-9+/=]+$/) && decryptedItem.content.length > 20) {
                      try {
                        const decryptResult = decryptFields({ text: decryptedItem.content }, ['text'], userId);
                        if (decryptResult && decryptResult.text) {
                          decryptedItem.content = decryptResult.text;
                        }
                      } catch (err) {
                        console.warn('Failed to decrypt list item content, using as-is:', err);
                        // Keep original content if decryption fails
                      }
                    }
                    // If not encrypted or decryption failed, keep the original content
                  } catch (err) {
                    console.error('Failed to decrypt list item content:', err);
                  }
                }
                
                // Decrypt sub-items if present
                if (Array.isArray(decryptedItem.subItems) && decryptedItem.subItems.length > 0) {
                  decryptedItem.subItems = decryptedItem.subItems.map(subItem => {
                    const decryptedSubItem = { ...subItem };                    if (typeof decryptedSubItem.content === 'string' && decryptedSubItem.content.trim() !== '') {
                      try {
                        // First check if the content appears to be encrypted
                        if (decryptedSubItem.content.match(/^[A-Za-z0-9+/=]+$/) && decryptedSubItem.content.length > 20) {
                          try {
                            const decryptResult = decryptFields({ text: decryptedSubItem.content }, ['text'], userId);
                            if (decryptResult && decryptResult.text) {
                              decryptedSubItem.content = decryptResult.text;
                            }
                          } catch (err) {
                            console.warn('Failed to decrypt sub-item content, using as-is:', err);
                            // Keep original content if decryption fails
                          }
                        }
                        // If not encrypted or decryption failed, keep the original content
                      } catch (err) {
                        console.error('Failed to decrypt sub-item content:', err);
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
        }
        
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
        }          // Encrypt all fields using the standard method
        let updateData = encryptFields({ title, description, content }, ENCRYPTED_FIELDS.PLANNER, userId);
        
        // If content is an array, we need special handling for nested structures
        if (content && Array.isArray(content) && content.length > 0) {
          // We'll re-process the content array to ensure proper encryption of nested elements
          updateData.content = content.map(block => {
            const encryptedBlock = { ...block };
            
            // Encrypt the content field in each block if it's a string
            if (typeof encryptedBlock.content === 'string' && encryptedBlock.content.trim() !== '') {
              try {
                encryptedBlock.content = encryptFields({ text: encryptedBlock.content }, ['text'], userId).text;
              } catch (err) {
                console.error('Failed to encrypt block content:', err);
                // Keep original content if encryption fails
              }
            }
            
            // Encrypt list items if present
            if (Array.isArray(encryptedBlock.listItems) && encryptedBlock.listItems.length > 0) {
              encryptedBlock.listItems = encryptedBlock.listItems.map(item => {
                const encryptedItem = { ...item };
                if (typeof encryptedItem.content === 'string' && encryptedItem.content.trim() !== '') {
                  try {
                    encryptedItem.content = encryptFields({ text: encryptedItem.content }, ['text'], userId).text;
                  } catch (err) {
                    console.error('Failed to encrypt list item content:', err);
                  }
                }
                
                // Encrypt sub-items if present
                if (Array.isArray(encryptedItem.subItems) && encryptedItem.subItems.length > 0) {
                  encryptedItem.subItems = encryptedItem.subItems.map(subItem => {
                    const encryptedSubItem = { ...subItem };
                    if (typeof encryptedSubItem.content === 'string' && encryptedSubItem.content.trim() !== '') {
                      try {
                        encryptedSubItem.content = encryptFields({ text: encryptedSubItem.content }, ['text'], userId).text;
                      } catch (err) {
                        console.error('Failed to encrypt sub-item content:', err);
                      }
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
