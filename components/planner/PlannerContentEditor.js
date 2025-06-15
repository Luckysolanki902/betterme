// components/planner/PlannerContentEditor.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  Paper,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
  Fab,
} from '@mui/material';
import TitleIcon from '@mui/icons-material/Title';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import SaveIcon from '@mui/icons-material/Save';
import { useRouter } from 'next/router';
import styles from './PlannerStyles.module.css';

const PlannerContentEditor = ({ 
  content = [], 
  onChange, 
  readOnly = false,
  onSave
}) => {
  const [blocks, setBlocks] = useState(content);
  const [anchorEl, setAnchorEl] = useState(null);
  const [addBlockIndex, setAddBlockIndex] = useState(null);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState(null);
  const [dropTargetIndex, setDropTargetIndex] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const dragSourceRef = useRef(null);
  const theme = useTheme();
  // Update blocks when content prop changes
  useEffect(() => {
    setBlocks(content);
  }, [content]);
  
  // Save handler
  const handleTriggerSave = () => {
    if (onSave && typeof onSave === 'function') {
      onSave(blocks);
      setHasChanges(false);
    }
  };
  
  // Add keyboard shortcut for saving (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); // Prevent the browser save dialog
        if (!readOnly && hasChanges) {
          handleTriggerSave();
        }
      }
    };
      document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [readOnly, hasChanges, onSave, blocks]);
    
  // Update parent component when blocks change
  useEffect(() => {
    if (onChange && !readOnly) {
      onChange(blocks);
      setHasChanges(true);
    }
  }, [blocks, onChange, readOnly]);
  
  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedBlockIndex(index);
    e.currentTarget.classList.add(styles.draggingBlock);
    // Store reference to the dragged element
    dragSourceRef.current = e.currentTarget;
    
    // Set drag image to improve UX (optional)
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      try {
        // Create a ghost image
        const ghostElement = e.currentTarget.cloneNode(true);
        ghostElement.style.position = 'absolute';
        ghostElement.style.top = '-1000px';
        document.body.appendChild(ghostElement);
        e.dataTransfer.setDragImage(ghostElement, 20, 20);
        
        // Clean up the ghost element after a short delay
        setTimeout(() => {
          document.body.removeChild(ghostElement);
        }, 100);
      } catch (err) {
        console.error('Error setting drag image:', err);
      }
    }
  };
  
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedBlockIndex === null) return;
    
    // Update the drop target indicator
    if (index !== dropTargetIndex) {
      setDropTargetIndex(index);
    }
  };
  
  const handleDragEnd = (e) => {
    if (dragSourceRef.current) {
      dragSourceRef.current.classList.remove(styles.draggingBlock);
    }
    setDraggedBlockIndex(null);
    setDropTargetIndex(null);
  };
  
  const handleDrop = (e, index) => {
    e.preventDefault();
    
    if (draggedBlockIndex === null || draggedBlockIndex === index) {
      return;
    }
    
    // Reorder the blocks
    const newBlocks = [...blocks];
    const [draggedBlock] = newBlocks.splice(draggedBlockIndex, 1);
    newBlocks.splice(index > draggedBlockIndex ? index - 1 : index, 0, draggedBlock);
    
    setBlocks(newBlocks);
    setDraggedBlockIndex(null);
    setDropTargetIndex(null);
  };
  
  const handleOpenMenu = (event, index) => {
    setAnchorEl(event.currentTarget);
    setAddBlockIndex(index);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
    const handleAddBlock = (type) => {
    const index = addBlockIndex !== null ? addBlockIndex + 1 : blocks.length;
    const newBlock = createNewBlock(type);
    
    const newBlocks = [...blocks];
    newBlocks.splice(index, 0, newBlock);
    
    setBlocks(newBlocks);
    handleCloseMenu();
  };
  
  const handleUpdateBlock = (index, updatedBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlock;
    setBlocks(newBlocks);
  };
  
  const handleDeleteBlock = (index) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    setBlocks(newBlocks);
  };
  
  const handleChangeBlockContent = (index, content) => {
    const newBlocks = [...blocks];
    newBlocks[index].content = content;
    setBlocks(newBlocks);
  };
  
  const handleChangeBlockType = (index, newType) => {
    const newBlocks = [...blocks];
    newBlocks[index] = {
      ...newBlocks[index],
      type: newType
    };
    setBlocks(newBlocks);
  };
  
  const handleChangeListItem = (blockIndex, itemIndex, content) => {
    const newBlocks = [...blocks];
    newBlocks[blockIndex].listItems[itemIndex].content = content;
    setBlocks(newBlocks);
  };
  
  const handleAddListItem = (blockIndex) => {
    const newBlocks = [...blocks];
    newBlocks[blockIndex].listItems.push({ content: '', subItems: [] });
    setBlocks(newBlocks);
  };
  
  const handleDeleteListItem = (blockIndex, itemIndex) => {
    const newBlocks = [...blocks];
    newBlocks[blockIndex].listItems = newBlocks[blockIndex].listItems.filter((_, i) => i !== itemIndex);
    setBlocks(newBlocks);
  };
  
  const handleAddSubItem = (blockIndex, itemIndex) => {
    const newBlocks = [...blocks];
    newBlocks[blockIndex].listItems[itemIndex].subItems.push({ content: '' });
    setBlocks(newBlocks);
  };
  
  const handleChangeSubItem = (blockIndex, itemIndex, subItemIndex, content) => {
    const newBlocks = [...blocks];
    newBlocks[blockIndex].listItems[itemIndex].subItems[subItemIndex].content = content;
    setBlocks(newBlocks);
  };
  
  const handleDeleteSubItem = (blockIndex, itemIndex, subItemIndex) => {
    const newBlocks = [...blocks];
    newBlocks[blockIndex].listItems[itemIndex].subItems = 
      newBlocks[blockIndex].listItems[itemIndex].subItems.filter((_, i) => i !== subItemIndex);
    setBlocks(newBlocks);
  };
  
  const createNewBlock = (type) => {
    switch (type) {
      case 'heading1':
      case 'heading2':
      case 'heading3':
      case 'body1':
      case 'body2':
      case 'body3':
        return { type, content: '' };
      case 'bulletedList':
      case 'numberedList':
        return { type, listItems: [{ content: '', subItems: [] }] };
      case 'embed':
        return { 
          type, 
          embeddedPageId: null,
          onUpdateBlock: handleUpdateBlock  // Pass the update callback
        };
      default:
        return { type: 'body1', content: '' };
    }
  };
  
  const renderBlock = (block, index) => {
    switch (block.type) {
      case 'heading1':
        return (
          <HeadingBlock 
            key={index}
            index={index}
            block={block}
            level={1}
            readOnly={readOnly}
            onChange={handleChangeBlockContent}
            onDelete={handleDeleteBlock}
            onTypeChange={handleChangeBlockType}
          />
        );
      case 'heading2':
        return (
          <HeadingBlock 
            key={index}
            index={index}
            block={block}
            level={2}
            readOnly={readOnly}
            onChange={handleChangeBlockContent}
            onDelete={handleDeleteBlock}
            onTypeChange={handleChangeBlockType}
          />
        );
      case 'heading3':
        return (
          <HeadingBlock 
            key={index}
            index={index}
            block={block}
            level={3}
            readOnly={readOnly}
            onChange={handleChangeBlockContent}
            onDelete={handleDeleteBlock}
            onTypeChange={handleChangeBlockType}
          />
        );
      case 'body1':
      case 'body2':
      case 'body3':
        return (
          <BodyBlock 
            key={index}
            index={index}
            block={block}
            readOnly={readOnly}
            onChange={handleChangeBlockContent}
            onDelete={handleDeleteBlock}
            onTypeChange={handleChangeBlockType}
          />
        );
      case 'bulletedList':
        return (
          <ListBlock 
            key={index}
            index={index}
            block={block}
            type="bulleted"
            readOnly={readOnly}
            onChangeItem={handleChangeListItem}
            onAddItem={handleAddListItem}
            onDeleteItem={handleDeleteListItem}
            onAddSubItem={handleAddSubItem}
            onChangeSubItem={handleChangeSubItem}
            onDeleteSubItem={handleDeleteSubItem}
            onDelete={handleDeleteBlock}
          />
        );
      case 'numberedList':
        return (
          <ListBlock 
            key={index}
            index={index}
            block={block}
            type="numbered"
            readOnly={readOnly}
            onChangeItem={handleChangeListItem}
            onAddItem={handleAddListItem}
            onDeleteItem={handleDeleteListItem}
            onAddSubItem={handleAddSubItem}
            onChangeSubItem={handleChangeSubItem}
            onDeleteSubItem={handleDeleteSubItem}
            onDelete={handleDeleteBlock}
          />
        );
      case 'embed':
        return (
          <EmbedBlock 
            key={index}
            index={index}
            block={block}
            readOnly={readOnly}
            onDelete={handleDeleteBlock}
          />
        );
      default:
        return null;
    }
  };
  return (
    <Box sx={{ mb: 4, position: 'relative' }}>
      {!readOnly && hasChanges && (
        <Fab
          className={styles.floatingSaveButton}
          onClick={handleTriggerSave}
          aria-label="save"
        >
          <SaveIcon />
        </Fab>
      )}
      
      {blocks.length > 0 ? (
        blocks.map((block, index) => (
          <Box key={index}>
            <Box
              className={styles.blockWrapper}
              draggable={!readOnly}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
            >
              {renderBlock(block, index)}
            </Box>
            
            {dropTargetIndex === index && draggedBlockIndex !== null && (
              <Box className={styles.dropIndicator} />
            )}
            
            {!readOnly && (
              <Box 
                sx={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  my: 1,
                  opacity: 0.3,
                  transition: 'opacity 0.2s',
                  '&:hover': {
                    opacity: 1
                  }
                }}
              >
                <IconButton 
                  size="small"
                  onClick={(e) => handleOpenMenu(e, index)}
                  sx={{
                    borderRadius: '6px',
                    p: 0.5,
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        ))
      ) : !readOnly ? (
        <Box 
          sx={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 120,
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: '8px',
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: alpha(theme.palette.background.paper, 0.5),
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.03),
              borderColor: alpha(theme.palette.primary.main, 0.3),
            }
          }}
          onClick={(e) => handleOpenMenu(e, -1)}
        >
          <Typography color="text.secondary">
            Click to add content
          </Typography>
        </Box>
      ) : (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No content
        </Typography>
      )}
            
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MenuItem onClick={() => handleAddBlock('heading1')}>
          <TitleIcon fontSize="small" sx={{ mr: 1 }} /> Heading 1
        </MenuItem>
        <MenuItem onClick={() => handleAddBlock('heading2')}>
          <TitleIcon fontSize="small" sx={{ mr: 1, transform: 'scale(0.85)' }} /> Heading 2
        </MenuItem>
        <MenuItem onClick={() => handleAddBlock('heading3')}>
          <TitleIcon fontSize="small" sx={{ mr: 1, transform: 'scale(0.75)' }} /> Heading 3
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAddBlock('body1')}>
          <TextFieldsIcon fontSize="small" sx={{ mr: 1 }} /> Body text
        </MenuItem>
        <MenuItem onClick={() => handleAddBlock('bulletedList')}>
          <FormatListBulletedIcon fontSize="small" sx={{ mr: 1 }} /> Bulleted list
        </MenuItem>
        <MenuItem onClick={() => handleAddBlock('numberedList')}>
          <FormatListNumberedIcon fontSize="small" sx={{ mr: 1 }} /> Numbered list
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAddBlock('embed')}>
          <InsertDriveFileOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Embed page
        </MenuItem>
      </Menu>
    </Box>
  );
};

// Heading Block Component
const HeadingBlock = ({ index, block, level, readOnly, onChange, onDelete, onTypeChange }) => {
  const variant = `h${level + 1}`;
  const fontWeight = level === 1 ? 700 : level === 2 ? 600 : 500;
  
  return (
    <Box 
      sx={{ 
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        py: 1,
        '&:hover .block-controls': {
          opacity: 1
        }
      }}
    >
      {!readOnly && (
        <Box 
          className="block-controls"
          sx={{
            position: 'absolute',
            left: -35,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            opacity: 0,
            transition: 'opacity 0.2s'
          }}
        >
          <Tooltip title="Drag to reorder">
            <DragIndicatorIcon fontSize="small" sx={{ color: 'text.disabled' }} />
          </Tooltip>
        </Box>
      )}
      
      <Box sx={{ width: '100%' }}>
        {readOnly ? (
          <Typography variant={variant} gutterBottom sx={{ fontWeight, mt: level === 1 ? 2 : 1 }}>
            {block.content}
          </Typography>
        ) : (
          <TextField
            fullWidth
            variant="outlined"
            value={block.content}
            onChange={(e) => onChange(index, e.target.value)}
            placeholder={`Heading ${level}`}
            InputProps={{
              sx: {
                fontSize: level === 1 ? '1.5rem' : level === 2 ? '1.25rem' : '1.15rem',
                fontWeight,
                py: 0.5
              }
            }}
            sx={{
              '.MuiOutlinedInput-notchedOutline': {
                border: 'none'
              },

            }}
          />
        )}
      </Box>
      
      {!readOnly && (
        <Box sx={{ ml: 1, mt: 1, opacity: 0.5 }}>
          <Tooltip title="Delete block">
            <IconButton size="small" onClick={() => onDelete(index)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

// Body Block Component
const BodyBlock = ({ index, block, readOnly, onChange, onDelete, onTypeChange }) => {
  return (
    <Box 
      sx={{ 
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        py: 1,
        '&:hover .block-controls': {
          opacity: 1
        }
      }}
    >
      {!readOnly && (
        <Box 
          className="block-controls"
          sx={{
            position: 'absolute',
            left: -35,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            opacity: 0,
            transition: 'opacity 0.2s'
          }}
        >
          <Tooltip title="Drag to reorder">
            <DragIndicatorIcon fontSize="small" sx={{ color: 'text.disabled' }} />
          </Tooltip>
        </Box>
      )}
      
      <Box sx={{ width: '100%' }}>
        {readOnly ? (
          <Typography variant="body1" paragraph>
            {block.content}
          </Typography>
        ) : (
          <TextField
            fullWidth
            multiline
            variant="outlined"
            value={block.content}
            onChange={(e) => onChange(index, e.target.value)}
            placeholder="Type something..."
            minRows={1}
            sx={{
              '.MuiOutlinedInput-notchedOutline': {
                border: 'none'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                border: '1px dashed #ccc'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                border: `1px solid #ccc`
              }
            }}
          />
        )}
      </Box>
      
      {!readOnly && (
        <Box sx={{ ml: 1, opacity: 0.5 }}>
          <Tooltip title="Delete block">
            <IconButton size="small" onClick={() => onDelete(index)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

// List Block Component
const ListBlock = ({ 
  index: blockIndex, 
  block, 
  type, 
  readOnly, 
  onChangeItem, 
  onAddItem, 
  onDeleteItem,
  onAddSubItem,
  onChangeSubItem,
  onDeleteSubItem,
  onDelete 
}) => {
  const theme = useTheme();
  
  return (
    <Box 
      sx={{ 
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        py: 1,
        '&:hover .block-controls': {
          opacity: 1
        }
      }}
    >
      {!readOnly && (
        <Box 
          className="block-controls"
          sx={{
            position: 'absolute',
            left: -35,
            top: '18px',
            display: 'flex',
            alignItems: 'center',
            opacity: 0,
            transition: 'opacity 0.2s'
          }}
        >
          <Tooltip title="Drag to reorder">
            <DragIndicatorIcon fontSize="small" sx={{ color: 'text.disabled' }} />
          </Tooltip>
        </Box>
      )}
      
      <Box sx={{ width: '100%' }}>
        <Box component={type === 'numbered' ? 'ol' : 'ul'} sx={{ pl: 2, m: 0 }}>
          {block.listItems.map((item, itemIndex) => (
            <Box key={itemIndex} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Box 
                  component="li" 
                  sx={{ 
                    mr: 1,
                    width: '100%',
                    listStyleType: type === 'numbered' ? 'decimal' : 'disc',
                  }}
                >
                  {readOnly ? (
                    <Typography>{item.content}</Typography>
                  ) : (                    <TextField
                      fullWidth
                      variant="outlined"
                      value={item.content}
                      onChange={(e) => onChangeItem(blockIndex, itemIndex, e.target.value)}
                      placeholder="List item"
                      size="small"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          onAddItem(blockIndex);
                        }
                      }}
                      sx={{
                        '.MuiOutlinedInput-notchedOutline': {
                          border: 'none'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          border: '1px dashed #ccc'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: `1px solid #ccc`
                        }
                      }}
                    />
                  )}
                </Box>
                
                {!readOnly && (
                  <Box sx={{ display: 'flex', mt: 1 }}>
                    <Tooltip title="Add sub-item">
                      <IconButton size="small" onClick={() => onAddSubItem(blockIndex, itemIndex)}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete item">
                      <IconButton 
                        size="small" 
                        onClick={() => onDeleteItem(blockIndex, itemIndex)}
                        disabled={block.listItems.length === 1}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
              
              {/* Sub-items */}
              {item.subItems && item.subItems.length > 0 && (
                <Box component={type === 'numbered' ? 'ol' : 'ul'} sx={{ pl: 4, mt: 1, mb: 0 }}>
                  {item.subItems.map((subItem, subIndex) => (
                    <Box 
                      key={subIndex} 
                      component="li" 
                      sx={{ 
                        mb: 1,
                        display: 'flex',
                        alignItems: 'flex-start',
                        listStyleType: type === 'numbered' ? 'decimal' : 'circle',
                      }}
                    >
                      {readOnly ? (
                        <Typography>{subItem.content}</Typography>
                      ) : (                        <TextField
                          fullWidth
                          variant="outlined"
                          value={subItem.content}
                          onChange={(e) => onChangeSubItem(blockIndex, itemIndex, subIndex, e.target.value)}
                          placeholder="Sub-item"
                          size="small"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              onAddSubItem(blockIndex, itemIndex);
                            }
                          }}
                          sx={{
                            '.MuiOutlinedInput-notchedOutline': {
                              border: 'none'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              border: '1px dashed #ccc'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              border: `1px solid #ccc`
                            }
                          }}
                        />
                      )}
                      
                      {!readOnly && (
                        <IconButton 
                          size="small" 
                          onClick={() => onDeleteSubItem(blockIndex, itemIndex, subIndex)}
                          sx={{ ml: 1, mt: 0.5 }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
        
        {!readOnly && (
          <Box sx={{ ml: 3, mt: 1 }}>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => onAddItem(blockIndex)}
              sx={{ textTransform: 'none' }}
            >
              Add item
            </Button>
          </Box>
        )}
      </Box>
      
      {!readOnly && (
        <Box sx={{ ml: 1, opacity: 0.5 }}>
          <Tooltip title="Delete list">
            <IconButton size="small" onClick={() => onDelete(blockIndex)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

// Embed Block Component
const EmbedBlock = ({ index, block, readOnly, onDelete }) => {
  const theme = useTheme();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [error, setError] = useState('');
  const [embeddedPage, setEmbeddedPage] = useState(null);

  // Fetch embedded page info if ID exists
  useEffect(() => {
    const fetchEmbeddedPage = async () => {
      if (!block.embeddedPageId) return;
      
      try {
        const res = await fetch(`/api/planner/${block.embeddedPageId}`);
        if (res.ok) {
          const pageData = await res.json();
          setEmbeddedPage(pageData);
        }
      } catch (err) {
        console.error('Error fetching embedded page:', err);
      }
    };
    
    fetchEmbeddedPage();
  }, [block.embeddedPageId]);

  // Create a new embedded page
  const handleCreateEmbeddedPage = async () => {
    if (!newPageTitle.trim()) {
      setError('Please enter a page title');
      return;
    }
    
    setIsCreating(true);
    setError('');
    
    try {
      // Get the current page ID from URL
      const currentPath = router.asPath;
      const currentPageId = currentPath.split('/planner/')[1];
      
      // Create new page as a child of current page with "embedded" flag
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newPageTitle,
          parentId: currentPageId,
          isEmbedded: true,
          content: [{ type: 'body1', content: 'Write something here...' }]
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create embedded page');
      }
      
      const newPage = await res.json();
      
      // Update the block with the new page ID
      const newBlock = { ...block, embeddedPageId: newPage._id };
      
      // Call a callback to update this block in parent
      if (typeof block.onUpdateBlock === 'function') {
        block.onUpdateBlock(index, newBlock);
      }
      
      setEmbeddedPage(newPage);
      setNewPageTitle('');
      setIsCreating(false);
    } catch (err) {
      console.error('Error creating embedded page:', err);
      setError('Failed to create embedded page');
      setIsCreating(false);
    }
  };

  // Navigate to the embedded page
  const handleOpenEmbeddedPage = () => {
    if (block.embeddedPageId) {
      router.push(`/planner/${block.embeddedPageId}`);
    }
  };
  
  return (
    <Box 
      sx={{ 
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        py: 1,
        '&:hover .block-controls': {
          opacity: 1
        }
      }}
    >
      {!readOnly && (
        <Box 
          className="block-controls"
          sx={{
            position: 'absolute',
            left: -35,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            opacity: 0,
            transition: 'opacity 0.2s'
          }}
        >
          <Tooltip title="Drag to reorder">
            <DragIndicatorIcon fontSize="small" sx={{ color: 'text.disabled' }} />
          </Tooltip>
        </Box>
      )}
      
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          p: 2,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '8px',
          backgroundColor: alpha(theme.palette.background.paper, 0.05),
          transition: 'all 0.2s ease',
          '&:hover': embeddedPage ? {
            borderColor: alpha(theme.palette.primary.main, 0.5),
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(66, 99, 235, 0.1)',
          } : {},
          cursor: embeddedPage ? 'pointer' : 'default',
        }}
        onClick={embeddedPage ? handleOpenEmbeddedPage : null}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <InsertDriveFileOutlinedIcon 
            fontSize="small" 
            sx={{ 
              mr: 1, 
              color: embeddedPage ? theme.palette.primary.main : 'text.secondary' 
            }} 
          />
          <Typography variant="subtitle2" sx={{ color: embeddedPage ? theme.palette.primary.main : 'inherit' }}>
            {embeddedPage ? embeddedPage.title : 'Embedded Page'}
          </Typography>
        </Box>
        
        {!embeddedPage && !readOnly && (
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter page title..."
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              error={!!error}
              helperText={error}
              InputProps={{
                sx: { borderRadius: '8px' }
              }}
              sx={{ mb: 2 }}
            />
            <Button 
              variant="contained" 
              size="small" 
              disabled={isCreating || !newPageTitle.trim()}
              onClick={handleCreateEmbeddedPage}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                background: 'linear-gradient(to right, #4263EB, #9370DB)',
              }}
            >
              {isCreating ? 'Creating...' : 'Create Embedded Page'}
            </Button>
          </Box>
        )}
        
        {!embeddedPage && readOnly && (
          <Typography color="text.secondary" variant="body2">
            No embedded page
          </Typography>
        )}
        
        {embeddedPage && (
          <Typography color="text.secondary" variant="body2">
            Click to open embedded page
          </Typography>
        )}
      </Paper>
      
      {!readOnly && (
        <Box sx={{ ml: 1, opacity: 0.5 }}>
          <Tooltip title="Delete embed">
            <IconButton size="small" onClick={() => onDelete(index)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

export default PlannerContentEditor;
