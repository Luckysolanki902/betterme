// pages/api/planner/index.js
import connectToMongo from '@/middleware/connectToMongo';
import PlannerPage from '@/models/PlannerPage';
import { getUserId } from '@/middleware/clerkAuth';
import { encryptFields, decryptFields, ENCRYPTED_FIELDS } from '@/utils/encryption';

// API handler for /api/planner - Gets all root level pages or creates a new page
const handler = async (req, res) => {
  switch (req.method) {    case 'GET':
      try {
        const userId = getUserId(req);
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Get all top-level pages (those with no parentId) that are not embedded
        const pages = await PlannerPage.find({ 
          userId,
          parentId: null,
          isEmbedded: { $ne: true } // Exclude embedded pages
        })
          .sort({ position: 1, createdAt: -1 })
          .select('title description isStatic childPages');          // Decrypt pages before returning, with full field coverage
        const decryptedPages = pages.map(page => {
          const pageObj = page.toObject();
          return decryptFields(pageObj, ENCRYPTED_FIELDS.PLANNER, userId);
        });
        
        return res.status(200).json(decryptedPages || []);
      } catch (error) {
        console.error('Error fetching planner pages:', error);
        return res.status(500).json({ error: 'Failed to fetch planner pages' });
      }
        case 'POST':
      try {
        const userId = getUserId(req);
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Create a new page
        const { title, description, parentId, isStatic, content = [] } = req.body;
        
        if (!title) {
          return res.status(400).json({ error: 'Title is required' });
        }
        
        // For content, either use an empty array or ensure it's an array
        let sanitizedContent = [];
        if (Array.isArray(content)) {
          sanitizedContent = content;
        } else if (typeof content === 'string') {
          try {
            // Try to parse if it's a stringified array
            sanitizedContent = JSON.parse(content);
          } catch (e) {
            console.warn('Could not parse content string:', e);
            sanitizedContent = [];
          }
        }
        
        // Create page data
        const pageData = {
          userId,
          title,
          description,
          parentId,
          isStatic: isStatic || false,
          content: sanitizedContent,
          position: 0
        };        // Encrypt all fields including content
        let encryptedPageData = encryptFields(pageData, ENCRYPTED_FIELDS.PLANNER, userId);
        
        // Process content array separately for nested elements if needed
        if (Array.isArray(encryptedPageData.content) && encryptedPageData.content.length > 0) {
          encryptedPageData.content = encryptedPageData.content.map(block => {
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
        }        // Create the new page with validation to ensure content is in the correct format
        const newPage = new PlannerPage(encryptedPageData);
        const savedPage = await newPage.save();
        
        // If this page has a parent, add it to the parent's childPages
        if (parentId) {
          await PlannerPage.findByIdAndUpdate(
            parentId,
            { $push: { childPages: savedPage._id } }
          );
        }          // Decrypt all fields for consistency
        const pageObj = savedPage.toObject();
        let decryptedSavedPage = decryptFields(pageObj, ENCRYPTED_FIELDS.PLANNER, userId);
        
        // Additional handling for content blocks if they still appear encrypted
        if (Array.isArray(decryptedSavedPage.content) && decryptedSavedPage.content.length > 0) {
          decryptedSavedPage.content = decryptedSavedPage.content.map(block => {
            const decryptedBlock = { ...block };
              // Decrypt the content field in each block
            if (typeof decryptedBlock.content === 'string' && decryptedBlock.content.trim() !== '') {
              try {
                // First check if the content appears to be encrypted
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
        
        return res.status(201).json(decryptedSavedPage);
      } catch (error) {
        console.error('Error creating planner page:', error);
        
        // Return a more informative error message
        if (error.name === 'ValidationError') {
          return res.status(400).json({ 
            error: 'Invalid page data: ' + error.message,
            details: error.errors
          });
        }
        
        return res.status(500).json({ error: 'Failed to create planner page' });
      }
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
