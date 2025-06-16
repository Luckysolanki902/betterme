// components/journal/JournalEditor.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Divider,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  useTheme,
  alpha,
  useMediaQuery
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import TitleIcon from '@mui/icons-material/Title';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import MoodIcon from '@mui/icons-material/Mood';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SaveIcon from '@mui/icons-material/Save';
import dayjs from 'dayjs';
import styles from './JournalStyles.module.css';
import MoodDisplay from './MoodDisplay';
// Mood options for the journal entry
const MOODS = [
  { emoji: '😊', label: 'happy', score: 9 },
  { emoji: '😌', label: 'calm', score: 8 },
  { emoji: '😄', label: 'excited', score: 10 },
  { emoji: '😐', label: 'neutral', score: 5 },
  { emoji: '😔', label: 'sad', score: 3 },
  { emoji: '😠', label: 'angry', score: 2 },
  { emoji: '😰', label: 'anxious', score: 4 },
  { emoji: '😴', label: 'tired', score: 4 }
];

// Journal editor component
const JournalEditor = ({ 
  date = dayjs(), 
  entry = null, 
  onSave,
  onClose
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    // State for journal entry data
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || [{ type: 'paragraph', content: '' }]);
  const [mood] = useState(entry?.mood || { score: 5, label: 'neutral' }); // Just store mood, don't let user change it
  const [tags, setTags] = useState(entry?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState('');
  const [suggestionDialog, setSuggestionDialog] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [tagMenuAnchorEl, setTagMenuAnchorEl] = useState(null);
  const [selectedTagIndex, setSelectedTagIndex] = useState(null);
  const editorRef = useRef(null);
  
  // Set up auto-save
  const autoSaveInterval = useRef(null);
  const AUTOSAVE_DELAY = 60000; // 60 seconds
  
  // Initialize auto-save
  useEffect(() => {
    if (hasChanges) {
      autoSaveInterval.current = setTimeout(() => {
        handleSave();
      }, AUTOSAVE_DELAY);
    }
    
    return () => {
      if (autoSaveInterval.current) {
        clearTimeout(autoSaveInterval.current);
      }
    };
  }, [hasChanges]);
    // Update hasChanges flag when content changes
  useEffect(() => {
    setHasChanges(true);
    
    // Reset the auto-save timer
    if (autoSaveInterval.current) {
      clearTimeout(autoSaveInterval.current);
    }
    autoSaveInterval.current = setTimeout(() => {
      handleSave();
    }, AUTOSAVE_DELAY);

    // Add cleanup for the timer
    return () => {
      if (autoSaveInterval.current) {
        clearTimeout(autoSaveInterval.current);
      }
    };
  }, [title, content, tags]);  // Check if we should detect mood with AI
  const shouldDetectMood = (currentMood, wordCount) => {
    // If no mood is set or it's the default neutral mood, detect mood
    if (!currentMood || (currentMood.label === 'neutral' && currentMood.score === 5)) {
      return true;
    }
    
    // If the entry is substantial (over 100 words) and hasn't been AI-analyzed yet
    if (wordCount > 100 && !currentMood.aiDetected) {
      return true;
    }
    
    // If the mood was last analyzed more than 10 seconds ago and content is substantial
    const lastAnalyzed = currentMood.lastAnalyzed;
    if (lastAnalyzed && wordCount > 50) {
      const tenSecondsAgo = Date.now() - 10 * 1000; // 10 seconds for testing; in prod would be longer
      if (new Date(lastAnalyzed).getTime() < tenSecondsAgo) {
        return true;
      }
    }
    
    return false;
  };
  
  // Detect mood using OpenAI
  const detectMood = async (contentToAnalyze) => {
    try {
      const response = await fetch('/api/journal/detect-mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: contentToAnalyze })
      });
      
      if (!response.ok) {
        throw new Error('Failed to detect mood');
      }
      
      const result = await response.json();
      const detectedMood = result.mood;
        // Mark that this mood was detected by AI and when
      detectedMood.aiDetected = true;
      detectedMood.lastAnalyzed = new Date().toISOString();
      
      return detectedMood;
    } catch (err) {
      console.error('Error detecting mood:', err);
      // Return the current mood if detection fails
      return mood;
    }
  };
    // Handle saving the journal entry
  const handleSave = async () => {
    if (!hasChanges) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      // Calculate word count
      let wordCount = 0;
      content.forEach(block => {
        if (block.content) {
          wordCount += block.content.trim().split(/\s+/).filter(Boolean).length;
        }
        if (Array.isArray(block.listItems)) {
          block.listItems.forEach(item => {
            if (item.content) {
              wordCount += item.content.trim().split(/\s+/).filter(Boolean).length;
            }
          });
        }
      });
        // Prepare data for saving
      const entryData = {
        entryDate: date,
        title,
        content,
        mood,  // Use the current mood, mood detection happens in parent component
        tags,
        wordCount
      };
      
      await onSave(entryData);
      setHasChanges(false);
    } catch (err) {
      console.error('Error saving journal entry:', err);
      setError('Failed to save your entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle adding a new content block
  const handleAddBlock = (type) => {
    const newBlock = { type, content: '' };
    if (type === 'bulletList' || type === 'numberedList') {
      newBlock.listItems = [{ content: '', checked: false }];
    }
    
    setContent([...content, newBlock]);
  };
  
  // Handle updating a content block
  const handleUpdateBlock = (index, updatedBlock) => {
    const newContent = [...content];
    newContent[index] = updatedBlock;
    setContent(newContent);
  };
  
  // Handle deleting a content block
  const handleDeleteBlock = (index) => {
    const newContent = content.filter((_, i) => i !== index);
    setContent(newContent);
  };
  
  // Handle adding a new tag
  const handleAddTag = () => {
    if (!newTag.trim() || tags.some(tag => tag.name.toLowerCase() === newTag.trim().toLowerCase())) {
      return;
    }
    
    const randomColors = [
      '#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336',
      '#009688', '#673ab7', '#e91e63', '#3f51b5', '#795548'
    ];
    
    const color = randomColors[Math.floor(Math.random() * randomColors.length)];
    setTags([...tags, { name: newTag.trim(), color }]);
    setNewTag('');
  };
  
  // Handle deleting a tag
  const handleDeleteTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
    setTagMenuAnchorEl(null);
  };
  
  // Handle editing a tag
  const handleEditTag = (index, color) => {
    const updatedTags = [...tags];
    updatedTags[index] = { ...updatedTags[index], color };
    setTags(updatedTags);
  };
  
  // Open tag menu
  const handleTagMenuOpen = (event, index) => {
    setTagMenuAnchorEl(event.currentTarget);
    setSelectedTagIndex(index);
  };
  
  // Close tag menu
  const handleTagMenuClose = () => {
    setTagMenuAnchorEl(null);
    setSelectedTagIndex(null);
  };
  
  // Get writing suggestions from OpenAI
  const getWritingSuggestions = async (type = 'continue') => {
    setLoadingSuggestions(true);
    setSuggestions([]);
    
    try {
      // Extract the current content as plain text for the API
      let currentText = '';
      content.forEach(block => {
        if (block.content) {
          currentText += block.content + ' ';
        }
        if (Array.isArray(block.listItems)) {
          block.listItems.forEach(item => {
            if (item.content) {
              currentText += '- ' + item.content + ' ';
            }
          });
        }
      });
      
      const response = await fetch('/api/journal/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentContent: currentText.trim(),
          type
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setSuggestionDialog(true);
    } catch (err) {
      console.error('Error getting writing suggestions:', err);
      setError('Failed to get writing suggestions. Please try again.');
    } finally {
      setLoadingSuggestions(false);
    }
  };
  
  // Use a suggestion by appending it to the current content
  const useSuggestion = (suggestion) => {
    // Add the suggestion as a new paragraph
    const newBlock = { type: 'paragraph', content: suggestion };
    setContent([...content, newBlock]);
    
    setSuggestionDialog(false);
  };

  // Render a block based on its type
  const renderBlock = (block, index) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <TextField
            key={index}
            multiline
            fullWidth
            variant="standard"
            placeholder="Start writing..."
            value={block.content}
            onChange={(e) => handleUpdateBlock(index, { ...block, content: e.target.value })}
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: '1rem',
                lineHeight: 1.6,
                p: 1,
                '&:focus': {
                  background: alpha(theme.palette.primary.light, 0.05)
                }
              }
            }}
          />
        );
        
      case 'heading1':
      case 'heading2':
      case 'heading3':
        const fontSize = block.type === 'heading1' ? '1.8rem' : block.type === 'heading2' ? '1.5rem' : '1.2rem';
        const fontWeight = block.type === 'heading1' ? 700 : block.type === 'heading2' ? 600 : 500;
        
        return (
          <TextField
            key={index}
            fullWidth
            variant="standard"
            placeholder={`${block.type.charAt(0).toUpperCase() + block.type.slice(1)}...`}
            value={block.content}
            onChange={(e) => handleUpdateBlock(index, { ...block, content: e.target.value })}
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize,
                fontWeight,
                p: 1,
                '&:focus': {
                  background: alpha(theme.palette.primary.light, 0.05)
                }
              }
            }}
          />
        );
        
      case 'quote':
        return (
          <TextField
            key={index}
            multiline
            fullWidth
            variant="standard"
            placeholder="Quote..."
            value={block.content}
            onChange={(e) => handleUpdateBlock(index, { ...block, content: e.target.value })}
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: '1rem',
                fontStyle: 'italic',
                borderLeft: `4px solid ${theme.palette.divider}`,
                pl: 2,
                py: 1,
                '&:focus': {
                  background: alpha(theme.palette.primary.light, 0.05)
                }
              }
            }}
          />
        );
        
      case 'bulletList':
      case 'numberedList':
        return (
          <Box key={index} sx={{ pl: 3 }}>
            {block.listItems?.map((item, itemIndex) => (
              <Box key={itemIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ mr: 1, width: 20, textAlign: 'center' }}>
                  {block.type === 'numberedList' ? `${itemIndex + 1}.` : '•'}
                </Typography>
                <TextField
                  fullWidth
                  variant="standard"
                  placeholder="List item..."
                  value={item.content}
                  onChange={(e) => {
                    const newListItems = [...block.listItems];
                    newListItems[itemIndex].content = e.target.value;
                    handleUpdateBlock(index, { ...block, listItems: newListItems });
                  }}
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      '&:focus': {
                        background: alpha(theme.palette.primary.light, 0.05)
                      }
                    }
                  }}
                />
                <IconButton 
                  size="small" 
                  onClick={() => {
                    const newListItems = [...block.listItems];
                    newListItems.splice(itemIndex, 1);
                    handleUpdateBlock(index, { ...block, listItems: newListItems });
                  }}
                  disabled={block.listItems.length <= 1}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button 
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => {
                const newListItems = [...block.listItems, { content: '', checked: false }];
                handleUpdateBlock(index, { ...block, listItems: newListItems });
              }}
              sx={{ ml: 3, mt: 1, textTransform: 'none' }}
            >
              Add Item
            </Button>
          </Box>
        );
        
      case 'code':
        return (
          <TextField
            key={index}
            multiline
            fullWidth
            variant="outlined"
            placeholder="Code snippet..."
            value={block.content}
            onChange={(e) => handleUpdateBlock(index, { ...block, content: e.target.value })}
            InputProps={{
              sx: {
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                bgcolor: alpha(theme.palette.text.primary, 0.04),
              }
            }}
            sx={{
              my: 1,
            }}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <Box>
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, md: 3 }, 
          mb: 4, 
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}
      >        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary }}>
              {dayjs(date).format('dddd, MMMM D, YYYY')}
            </Typography>
            
            {/* Display the detected mood */}
            {mood && mood.label && (
              <MoodDisplay mood={mood} size="small" />
            )}
          </Box>
          
          <Button 
            variant="outlined"
            color="primary"
            size="small"
            onClick={onClose}
          >
            Close
          </Button>
        </Box>
        
        <TextField
          fullWidth
          placeholder="Title (optional)"
          variant="standard"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: '1.8rem',
              fontWeight: 700,
              mb: 3,
              '&::placeholder': {
                color: alpha(theme.palette.text.primary, 0.4)
              }
            }
          }}
        />
        
        <Box>
          <Paper 
            variant="outlined" 
            sx={{ 
              mb: 3, 
              borderRadius: 1, 
              overflow: 'hidden',
              borderColor: theme.palette.divider
            }}
          >
            <Box className={styles.editorToolbar}>
              <Tooltip title="Heading 1">
                <IconButton size="small" onClick={() => handleAddBlock('heading1')}>
                  <TitleIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Heading 2">
                <IconButton size="small" onClick={() => handleAddBlock('heading2')}>
                  <TitleIcon sx={{ transform: 'scale(0.85)' }} />
                </IconButton>
              </Tooltip>
              
              <div className={styles.toolbarDivider} />
              
              <Tooltip title="Bold">
                <IconButton size="small">
                  <FormatBoldIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Italic">
                <IconButton size="small">
                  <FormatItalicIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Underline">
                <IconButton size="small">
                  <FormatUnderlinedIcon />
                </IconButton>
              </Tooltip>
              
              <div className={styles.toolbarDivider} />
              
              <Tooltip title="Bulleted List">
                <IconButton size="small" onClick={() => handleAddBlock('bulletList')}>
                  <FormatListBulletedIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Numbered List">
                <IconButton size="small" onClick={() => handleAddBlock('numberedList')}>
                  <FormatListNumberedIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Quote">
                <IconButton size="small" onClick={() => handleAddBlock('quote')}>
                  <FormatQuoteIcon />
                </IconButton>
              </Tooltip>
              
              {!isMobile && (
                <>
                  <div className={styles.toolbarDivider} />
                  
                  <Tooltip title="Get Writing Suggestions">
                    <IconButton 
                      size="small" 
                      onClick={() => getWritingSuggestions('continue')}
                      disabled={loadingSuggestions}
                      color="primary"
                    >
                      <LightbulbOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
            
            <Box 
              className={styles.editor}
              sx={{ 
                minHeight: 300,
                p: 2,
                bgcolor: 'background.paper'
              }}
              ref={editorRef}
            >
              {content.map((block, index) => (
                <Box key={index} sx={{ position: 'relative', mb: 2 }}>
                  {renderBlock(block, index)}
                  
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      right: -12,
                      top: 0,
                      opacity: 0.3,
                      '&:hover': {
                        opacity: 1
                      }
                    }}
                    onClick={() => handleDeleteBlock(index)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              
              {content.length === 0 && (
                <Box 
                  onClick={() => handleAddBlock('paragraph')} 
                  sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    color: 'text.disabled',
                    cursor: 'text'
                  }}
                >
                  <Typography>Click here to start writing...</Typography>
                </Box>
              )}
              
              <Button
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => handleAddBlock('paragraph')}
                sx={{ mt: 1, textTransform: 'none' }}
              >
                Add Paragraph
              </Button>
            </Box>
          </Paper>
            {/* Mood is now detected automatically based on journal content */}
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
              <LocalOfferIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Tags
            </Typography>
            
            <Box className={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag.name}
                  sx={{
                    bgcolor: alpha(tag.color, 0.1),
                    color: tag.color,
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: alpha(tag.color, 0.2)
                    }
                  }}
                  onClick={(e) => handleTagMenuOpen(e, index)}
                />
              ))}
              
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <TextField
                  placeholder="Add tag..."
                  variant="outlined"
                  size="small"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTag();
                      e.preventDefault();
                    }
                  }}
                  sx={{ maxWidth: 150 }}
                />
                
                <Button
                  variant="text"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                  sx={{ minWidth: 0 }}
                >
                  Add
                </Button>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              startIcon={<LightbulbOutlinedIcon />}
              onClick={() => getWritingSuggestions('question')}
              disabled={loadingSuggestions}
            >
              Get Reflection Questions
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? 'Saving...' : 'Save Entry'}
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Writing suggestions dialog */}
      <Dialog 
        open={suggestionDialog} 
        onClose={() => setSuggestionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Writing Suggestions
          <IconButton
            aria-label="close"
            onClick={() => setSuggestionDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Click on any suggestion to add it to your journal entry.
          </Typography>
          
          {suggestions.map((suggestion, index) => (
            <Paper
              key={index}
              elevation={0}
              className={styles.suggestionCard}
              onClick={() => useSuggestion(suggestion)}
            >
              <Typography variant="body1">{suggestion}</Typography>
            </Paper>
          ))}
          
          {suggestions.length === 0 && !loadingSuggestions && (
            <Typography variant="body2" color="textSecondary" align="center">
              No suggestions available. Try again with more content.
            </Typography>
          )}
          
          {loadingSuggestions && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={30} />
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setSuggestionDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Tag edit menu */}
      <Menu
        anchorEl={tagMenuAnchorEl}
        open={Boolean(tagMenuAnchorEl)}
        onClose={handleTagMenuClose}
      >
        <MenuItem onClick={() => handleDeleteTag(selectedTagIndex)}>
          Delete Tag
        </MenuItem>
        <Divider />
        <MenuItem disabled>Change Color:</MenuItem>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxWidth: 200, p: 1 }}>
          {['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336', 
            '#009688', '#673ab7', '#e91e63', '#3f51b5', '#795548'].map((color) => (
            <Box
              key={color}
              sx={{
                width: 24,
                height: 24,
                bgcolor: color,
                borderRadius: '50%',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${color}`
                }
              }}
              onClick={() => {
                handleEditTag(selectedTagIndex, color);
                handleTagMenuClose();
              }}
            />
          ))}
        </Box>
      </Menu>
      
      {/* Error notification */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      {/* Floating suggestion button on mobile */}
      {isMobile && (
        <Button
          variant="contained"
          color="primary"
          startIcon={loadingSuggestions ? <CircularProgress size={20} color="inherit" /> : <LightbulbOutlinedIcon />}
          className={styles.floatingSuggestionBtn}
          onClick={() => getWritingSuggestions('continue')}
          disabled={loadingSuggestions}
        >
          Get Ideas
        </Button>
      )}
    </Box>
  );
};

export default JournalEditor;
