// pages/api/planner/index.js
import connectToMongo from '@/middleware/connectToMongo';
import PlannerPage from '@/models/PlannerPage';
import { getUserId } from '@/middleware/clerkAuth';
import { encryptFields, decryptFields, ENCRYPTED_FIELDS } from '@/utils/encryption';

// Helper function to count words in Lexical editorState
function countWordsInLexicalContent(editorStateStr) {
  try {
    // Parse the Lexical editor state JSON
    const editorState = JSON.parse(editorStateStr);
    
    // Recursively extract text from the editor state
    function extractTextFromNode(node) {
      let text = '';
      
      // Handle text nodes
      if (node.type === 'text') {
        return node.text || '';
      }
      
      // Handle nodes with children (paragraphs, headings, lists, etc.)
      if (node.children) {
        node.children.forEach((childNode) => {
          text += ' ' + extractTextFromNode(childNode);
        });
      }
      
      return text;
    }
    
    // Extract text from the root node's children
    const textContent = extractTextFromNode(editorState.root);
    
    // Count words (split by whitespace and filter out empty strings)
    const words = textContent.trim().split(/\s+/).filter(Boolean);
    return words.length;
  } catch (error) {
    console.error('Error counting words in Lexical content:', error);
    return 0;
  }
}

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
          // For content, use Lexical editor state structure
        let sanitizedContent = {
          editorState: content?.editorState || JSON.stringify({
            root: {
              children: [
                {
                  children: [],
                  direction: null,
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1
                }
              ],
              direction: null,
              format: "",
              indent: 0,
              type: "root",
              version: 1
            }
          })
        };
        
        // Create page data
        const pageData = {
          userId,
          title,
          description,
          parentId,
          isStatic: isStatic || false,
          content: sanitizedContent,
          position: 0
        };        // Encrypt only title and description, keep content as structured data
        let encryptedPageData = encryptFields(pageData, ENCRYPTED_FIELDS.PLANNER, userId);        // Handle Lexical editor content - encrypt the entire editorState JSON string
        if (pageData.content && pageData.content.editorState) {
          try {
            encryptedPageData.content = {
              editorState: encryptFields(
                { text: pageData.content.editorState }, 
                ['text'], 
                userId
              ).text
            };
          } catch (err) {
            console.error('Failed to encrypt editor content:', err);
            // Keep original content if encryption fails
            encryptedPageData.content = pageData.content;
          }
        }// Create the new page with validation to ensure content is in the correct format
        const newPage = new PlannerPage(encryptedPageData);
        const savedPage = await newPage.save();
        
        // If this page has a parent, add it to the parent's childPages
        if (parentId) {
          await PlannerPage.findByIdAndUpdate(
            parentId,
            { $push: { childPages: savedPage._id } }
          );
        }          // Decrypt only title and description, content is handled separately
        const pageObj = savedPage.toObject();
        let decryptedSavedPage = decryptFields(pageObj, ENCRYPTED_FIELDS.PLANNER, userId);
        
        // Handle content blocks decryption if they have encrypted text
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
