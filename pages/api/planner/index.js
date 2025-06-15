// pages/api/planner/index.js
import connectToMongo from '@/middleware/connectToMongo';
import PlannerPage from '@/models/PlannerPage';
const { encryptFields, decryptArray, encryptData, decryptData, ENCRYPTED_FIELDS } = require('@/utils/encryption');
const { getUserId } = require('@/middleware/encryption');

// API handler for /api/planner - Gets all root level pages or creates a new page
const handler = async (req, res) => {
  switch (req.method) {    case 'GET':      try {
        const userId = getUserId(req);        // Get all top-level pages (those with no parentId) that are not embedded
        const pages = await PlannerPage.find({ 
          parentId: null,
          isEmbedded: { $ne: true } // Exclude embedded pages
        })
          .sort({ position: 1, createdAt: -1 })
          .select('title description isStatic childPages');
        
        // Defensive check for pages data
        if (!pages) {
          return res.status(200).json([]);
        }
            try {
          // Decrypt sensitive fields before sending
          const decryptedPages = decryptArray(pages, ENCRYPTED_FIELDS.PLANNER, userId);
          return res.status(200).json(decryptedPages);
        } catch (decryptError) {
          console.error('Error decrypting planner pages:', decryptError);
          // If decryption fails, send basic data without sensitive fields
          const safeFields = Array.isArray(pages) ? pages.map(page => {
            const safePage = { 
              _id: page._id, 
              isStatic: page.isStatic,
              childPages: page.childPages
            };
            return safePage;
          }) : [];
          return res.status(200).json(safeFields);
        }
        
        return res.status(200).json(decryptedPages);
      } catch (error) {
        console.error('Error fetching planner pages:', error);
        return res.status(500).json({ error: 'Failed to fetch planner pages' });
      }
      case 'POST':
      try {
        const userId = getUserId(req);        // Create a new page
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
        
        // Encrypt title and description
        const encryptedData = encryptFields({ 
          title, 
          description
        }, ['title', 'description'], userId);
        
        // For content blocks, encrypt each block's content separately
        // This maintains the array structure needed by the schema
        const encryptedContent = sanitizedContent.map(block => {
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
        
        // Create the new page
        const newPage = new PlannerPage({
          ...encryptedData,
          content: encryptedContent,
          parentId,
          isStatic: isStatic || false,
        });
          const savedPage = await newPage.save();
        
        // If this page has a parent, add it to the parent's childPages
        if (parentId) {
          await PlannerPage.findByIdAndUpdate(
            parentId,
            { $push: { childPages: savedPage._id } }
          );
        }
        
        try {
          // Manually decrypt the content blocks to return to client
          const decryptedContent = savedPage.content?.map(block => {
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
            ...savedPage.toObject(),
            title,
            description,
            content: decryptedContent || []
          };
          
          return res.status(201).json(decryptedPage);
        } catch (decryptError) {
          console.error('Error creating decrypted response:', decryptError);
          
          // Return basic data if decryption fails
          return res.status(201).json({
            _id: savedPage._id,
            title: title,
            description: description,
            parentId: savedPage.parentId,
            childPages: savedPage.childPages,
            isStatic: savedPage.isStatic,
            createdAt: savedPage.createdAt,
            updatedAt: savedPage.updatedAt
          });
        }
      } catch (error) {
        console.error('Error creating planner page:', error);
        return res.status(500).json({ error: 'Failed to create planner page' });
      }
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
