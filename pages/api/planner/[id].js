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
        
        // Decrypt the entire page first to handle standard fields
        const pageObj = page.toObject();
        let decryptedPage = decryptFields(pageObj, ENCRYPTED_FIELDS.PLANNER, userId);
          // Special handling for Lexical editorState
        if (decryptedPage.content && decryptedPage.content.editorState) {
          try {
            // Check if the editorState looks encrypted
            const editorState = decryptedPage.content.editorState;
            if (typeof editorState === 'string' && 
                !editorState.startsWith('{') && !editorState.startsWith('[') &&
                editorState.match(/^[A-Za-z0-9+/=]+$/) && 
                editorState.length > 20) {
              // Attempt to decrypt the editorState
              try {
                const decryptResult = decryptFields({ text: editorState }, ['text'], userId);
                if (decryptResult && decryptResult.text) {
                  // Handle the case where decryption returns an object instead of string
                  const decryptedText = typeof decryptResult.text === 'object' 
                    ? JSON.stringify(decryptResult.text) 
                    : decryptResult.text;
                  
                  try {
                    // Verify it's valid JSON after decryption
                    const parsed = JSON.parse(decryptedText);
                    decryptedPage.content.editorState = decryptedText;
                    console.log('Successfully decrypted and validated editor state');
                  } catch (jsonErr) {
                    console.warn('Decrypted content is not valid JSON:', jsonErr);
                    // Create a fresh empty document instead of keeping encrypted content
                    decryptedPage.content.editorState = JSON.stringify({
                      root: {
                        children: [
                          {
                            children: [
                              {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "",
                                type: "text",
                                version: 1
                              }
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "paragraph",
                            version: 1
                          }
                        ],
                        direction: "ltr",
                        format: "",
                        indent: 0,
                        type: "root",
                        version: 1
                      }
                    });
                  }
                }
              } catch (decryptErr) {
                console.error('Error during decryption of editor state:', decryptErr);
                // Keep the encrypted state as is, will be handled by the editor
              }
            }
          } catch (err) {
            console.error('Error decrypting Lexical editorState:', err);
            // Keep the original content if decryption fails
          }
        }
        
        // Handle legacy content blocks if present
        if (Array.isArray(decryptedPage.content) && decryptedPage.content.length > 0) {
          // Keep this for backward compatibility with old format
          decryptedPage.content = decryptedPage.content.map(block => {
            const decryptedBlock = { ...block };
            
            // Decrypt the content field in each block if it still looks encrypted
            if (typeof decryptedBlock.content === 'string' && decryptedBlock.content.trim() !== '') {
              try {
                // Only try to decrypt if it looks like encrypted data (base64 with colons)
                if (decryptedBlock.content.match(/^[A-Za-z0-9+/=]+$/) && 
                    decryptedBlock.content.length > 20 && 
                    decryptedBlock.content.includes('=')) {
                  try {
                    const decryptResult = decryptFields({ text: decryptedBlock.content }, ['text'], userId);
                    if (decryptResult && decryptResult.text && decryptResult.text !== decryptedBlock.content) {
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
                const decryptedItem = { ...item };
                
                if (typeof decryptedItem.content === 'string' && decryptedItem.content.trim() !== '') {
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
                    const decryptedSubItem = { ...subItem };
                    
                    if (typeof decryptedSubItem.content === 'string' && decryptedSubItem.content.trim() !== '') {
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
        }
        
        // Find the existing page first to ensure it exists and belongs to the user
        const existingPage = await PlannerPage.findOne({ _id: id, userId });
        if (!existingPage) {
          return res.status(404).json({ error: 'Page not found' });
        }
        
        // Encrypt title and description
        let updateData = encryptFields({ title, description }, ENCRYPTED_FIELDS.PLANNER, userId);
        
        // Special handling for Lexical editorState
        if (content && content.editorState !== undefined) {
          // Make sure editorState is a string
          let editorStateStr = content.editorState;
          if (typeof editorStateStr !== 'string' && editorStateStr !== null) {
            editorStateStr = JSON.stringify(editorStateStr);
          }
            // Don't encrypt null or empty strings
          if (editorStateStr === null || editorStateStr === '') {
            updateData.content = { editorState: null };
          } else {
            // Verify it's valid JSON before encrypting
            try {
              // Parse to validate and ensure we have clean JSON
              const parsedState = JSON.parse(editorStateStr);
              
              // Clean up any special markers we may have added
              if (parsedState.root && parsedState.root.__encrypted) {
                delete parsedState.root.__encrypted;
              }
              
              // Convert back to string for encryption
              const cleanJsonString = JSON.stringify(parsedState);
              
              console.log('Encrypting valid JSON editor state');
              
              // Encrypt the validated JSON string
              const encryptedResult = encryptFields({ text: cleanJsonString }, ['text'], userId);
              const encryptedText = encryptedResult.text;
              
              // Verify we have a string (not object) for storage
              if (typeof encryptedText === 'string') {
                updateData.content = { editorState: encryptedText };
              } else {
                // If encryption returned an object instead of string, handle it
                updateData.content = { 
                  editorState: JSON.stringify(encryptedText) 
                };
                console.log('Converted encrypted object to string for storage');
              }
            } catch (e) {
              console.error('Invalid JSON in editorState, not saving:', e);
              return res.status(400).json({ error: 'Invalid editor state format' });
            }
          }
        }
        // Handle legacy content array format (backward compatibility)
        else if (content && Array.isArray(content) && content.length > 0) {
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
                    // Keep original content if encryption fails
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
                        // Keep original content if encryption fails
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
        
        // Update the page
        const updatedPage = await PlannerPage.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true } // Return the updated document
        );
        
        // Decrypt the updated page for the response
        const updatedPageObj = updatedPage.toObject();
        let decryptedPage = decryptFields(updatedPageObj, ENCRYPTED_FIELDS.PLANNER, userId);
        
        // Special handling for Lexical editorState in the response
        if (decryptedPage.content && decryptedPage.content.editorState) {
          try {
            // Check if the editorState looks encrypted
            const editorState = decryptedPage.content.editorState;
            if (typeof editorState === 'string' && 
                !editorState.startsWith('{') && !editorState.startsWith('[') &&
                editorState.match(/^[A-Za-z0-9+/=]+$/) && 
                editorState.length > 20) {
                // Attempt to decrypt the editorState
              const decryptResult = decryptFields({ text: editorState }, ['text'], userId);
              if (decryptResult && decryptResult.text) {
                // Handle case where decryption returns an object
                const decryptedText = typeof decryptResult.text === 'object'
                  ? JSON.stringify(decryptResult.text)
                  : decryptResult.text;
                  
                try {
                  // Verify it's valid JSON
                  JSON.parse(decryptedText);
                  decryptedPage.content.editorState = decryptedText;
                  console.log('Successfully decrypted editor state for response');
                } catch (jsonErr) {
                  console.warn('Response decryption produced invalid JSON:', jsonErr);
                  // Keep original if decryption produces invalid JSON
                }
              }
            }
          } catch (err) {
            console.error('Error decrypting Lexical editorState in response:', err);
            // Keep the encrypted state as is if decryption fails
          }
        }
        
        // Return the decrypted page
        return res.status(200).json(decryptedPage);
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
        
        // Find the page first to check if it exists and belongs to the user
        const page = await PlannerPage.findOne({ _id: id, userId });
        if (!page) {
          return res.status(404).json({ error: 'Page not found' });
        }
        
        // Delete all child pages recursively
        await deleteChildPages(id, userId);
        
        // Delete the page itself
        await PlannerPage.deleteOne({ _id: id, userId });
        
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error deleting planner page:', error);
        return res.status(500).json({ error: 'Failed to delete planner page' });
      }
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};

// Helper function to recursively delete child pages
const deleteChildPages = async (parentId, userId) => {
  const childPages = await PlannerPage.find({ parentId, userId });
  
  for (const child of childPages) {
    // Recursively delete grandchildren
    await deleteChildPages(child._id, userId);
    
    // Delete the child page
    await PlannerPage.deleteOne({ _id: child._id });
  }
};

export default connectToMongo(handler);
