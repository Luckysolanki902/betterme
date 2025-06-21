// SimpleJournalEditor.js.new - temporary file for fixing formatting issues
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
  Paper,
  Tooltip,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  useMediaQuery
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import MoodDisplay from './MoodDisplay';
import { DEFAULT_MOOD } from '@/utils/moods';

// Constants for timers
const AUTOSAVE_DELAY = 30000; // 30 seconds
const AUTO_SUGGESTION_DELAY = 30000; // 30 seconds
const MOOD_UPDATE_DELAY = 30000; // 30 seconds

const SimpleJournalEditor = ({ 
  entry = null, 
  onSave, 
  onUpdateMood,
  onClose,
  date = dayjs().toDate() 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Helper function to count words - defined early to avoid reference errors
  const countWords = (text) => {
    // Make sure text is a string and not null/undefined before using trim
    if (!text || typeof text !== 'string') {
      return 0;
    }
    // Count words (split by whitespace and filter out empty strings)
    return text.trim().split(/\s+/).filter(Boolean).length;
  };
  
  // Content state
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [mood, setMood] = useState(entry?.mood || DEFAULT_MOOD);
  const [wordCount, setWordCount] = useState(0);
  const [moodDetecting, setMoodDetecting] = useState(false);
    // Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [topSuggestion, setTopSuggestion] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // Timers
  const autoSaveInterval = useRef(null);
  const moodUpdateInterval = useRef(null);
  const suggestionInterval = useRef(null);
  const typingTimer = useRef(null);
  const [isUserTyping, setIsUserTyping] = useState(false);

  // Update word count
  const updateWordCount = useCallback((text) => {
    const count = countWords(text);
    setWordCount(count);
    return count;
  }, []);

  // Initialize content from entry
  useEffect(() => {
    // Always initialize content as a string even if entry is null
    const safeContent = (entry && typeof entry.content === 'string') ? entry.content : '';
    setContent(safeContent);
    updateWordCount(safeContent);
  }, [entry, updateWordCount]);

  // Handle text changes
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    // Ensure content is always a string
    setContent(typeof newContent === 'string' ? newContent : '');
    setHasChanges(true);
    setIsUserTyping(true);
    
    // Reset typing timer
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setIsUserTyping(false);
      updateWordCount(newContent);
    }, 1000);
  };

  // Handle save action
  const handleSave = useCallback(async (isManualSave = false) => {
    if (!hasChanges && !isManualSave) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      // Ensure content is a string before saving
      const safeContent = typeof content === 'string' ? content : '';
      
      // Count words directly to avoid dependencies
      const finalWordCount = countWords(safeContent);
      
      const entryData = {
        entryDate: date,
        content: safeContent,
        mood,
        wordCount: finalWordCount,
        forceMoodUpdate: isManualSave,
      };
      
      await onSave(entryData);
      setHasChanges(false);
    } catch (err) {
      console.error('Error saving journal entry:', err);
      setError('Failed to save your entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [hasChanges, date, content, mood, onSave]);
  // Combined function to analyze content for both mood and suggestions
  const analyzeContent = useCallback(async (forceUpdate = false) => {
    if (!content || typeof content !== 'string' || content.trim().length < 20 || (isUserTyping && !forceUpdate)) return;
    
    // Set both loading states
    setMoodDetecting(true);
    setLoadingSuggestions(true);
    
    try {
      const response = await fetch('/api/journal/analyze-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content, // Send the entire content for better context
          count: 5
        }),
      });
        if (response.ok) {
        const data = await response.json();
        
        // Update mood if available
        if (data.mood) {
          // Update UI mood
          setMood(data.mood);
          
          // Call parent callback to update mood
          if (onUpdateMood) {
            onUpdateMood(data.mood);
          }
        }
        
        // Update suggestions if available
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
          
          // Set top suggestion separately to display directly on screen
          if (data.topSuggestion) {
            setTopSuggestion(data.topSuggestion);
          } else {
            setTopSuggestion(data.suggestions[0]);
          }
        }
      }
    } catch (error) {
      console.error("Error analyzing journal content:", error);
    } finally {
      setMoodDetecting(false);
      setLoadingSuggestions(false);
    }
  }, [content, isUserTyping, onUpdateMood]);
  
  // Wrapper functions for backward compatibility and clear naming
  const updateMoodFromContent = useCallback(() => {
    return analyzeContent(true); // Force update
  }, [analyzeContent]);
  
  const fetchSuggestions = useCallback(() => {
    return analyzeContent(true); // Force update
  }, [analyzeContent]);
  
  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    setContent(prev => {
      // Ensure prev is a string
      const safeContent = typeof prev === 'string' ? prev : '';
      // If the content ends with a space or is empty, we don't need to add a space
      const needsSpace = safeContent.length > 0 && !safeContent.endsWith(' ');
      return safeContent + (needsSpace ? ' ' : '') + suggestion;
    });
    
    setHasChanges(true);
    setSuggestionsOpen(false);
  };
  
  // Handle mood selection
  const handleUpdateMood = (newMood) => {
    setMood(newMood);
    if (onUpdateMood) {
      onUpdateMood(newMood);
    }
    setHasChanges(true);
  };
  
  // Setup auto-save, auto mood update
  useEffect(() => {
    if (hasChanges) {
      // Clear previous auto-save timer
      if (autoSaveInterval.current) clearTimeout(autoSaveInterval.current);
      autoSaveInterval.current = setTimeout(() => handleSave(false), AUTOSAVE_DELAY);
      
      // Clear previous auto-mood update timer
      if (moodUpdateInterval.current) clearTimeout(moodUpdateInterval.current);
      
      // If we have enough content, auto-detect mood after a delay
      if (wordCount > 30 && !isUserTyping) {
        moodUpdateInterval.current = setTimeout(() => {
          updateMoodFromContent();
        }, MOOD_UPDATE_DELAY);
      }
    }
    
    return () => {
      if (autoSaveInterval.current) clearTimeout(autoSaveInterval.current);
      if (moodUpdateInterval.current) clearTimeout(moodUpdateInterval.current);
    };
  }, [hasChanges, handleSave, wordCount, isUserTyping, updateMoodFromContent]);
    // Setup suggestion timer - only start after delay, no immediate fetch
  useEffect(() => {
    if (suggestionInterval.current) clearInterval(suggestionInterval.current);
    
    // Set up timer to fetch suggestions periodically, but don't run immediately
    const timer = setTimeout(() => {
      // Only start the periodic updates after the initial delay
      suggestionInterval.current = setInterval(() => {
        analyzeContent(); // Use the combined analyzer
      }, AUTO_SUGGESTION_DELAY);
    }, AUTO_SUGGESTION_DELAY); // Initial delay also set to same interval
    
    // No immediate fetch on first load or content change
    
    return () => {
      clearTimeout(timer);
      if (suggestionInterval.current) clearInterval(suggestionInterval.current);
    };
  }, [analyzeContent]);
  
  return (
    <Box sx={{ mt: 2 }}>
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Editor header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" component="h2">
            {dayjs(date).format('dddd, MMMM D, YYYY')}
          </Typography>
          
          <MoodDisplay 
            mood={mood} 
            updating={moodDetecting}
            tooltipText="Current mood"
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Get writing suggestions">
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={
                loadingSuggestions 
                ? <CircularProgress size={16} color="inherit" /> 
                : <LightbulbOutlinedIcon />
              }
              onClick={() => setSuggestionsOpen(true)}
              disabled={loadingSuggestions || !content || typeof content !== 'string' || content.trim().length < 10}
            >
              Suggestions
            </Button>
          </Tooltip>
          
          <Tooltip title="Detect mood from text">
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={
                moodDetecting 
                ? <CircularProgress size={16} color="inherit" /> 
                : <AutorenewIcon />
              }
              onClick={updateMoodFromContent}
              disabled={moodDetecting || !content || typeof content !== 'string' || content.trim().length < 20}
            >
              Update Mood
            </Button>
          </Tooltip>
        </Box>      </Box>
      
      {/* Top Suggestion Display */}
      {topSuggestion && !suggestionsOpen && (
        <Box 
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: alpha(theme.palette.secondary.light, 0.07),
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LightbulbOutlinedIcon color="secondary" sx={{ fontSize: '1.2rem' }} />
            <Typography color="text.secondary" fontStyle="italic" fontSize="0.95rem">
              {topSuggestion}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>

            
            <IconButton 
              size="small" 
              onClick={() => setSuggestionsOpen(true)}
              sx={{ fontSize: '0.8rem' }}
            >
              <Tooltip title="See more suggestions">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  •••
                </Box>
              </Tooltip>
            </IconButton>
          </Box>
        </Box>
      )}
      
      {/* Full Writing suggestions display */}
      {suggestionsOpen && (
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            background: alpha(theme.palette.secondary.light, 0.1),
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Writing Suggestions
            </Typography>
            <IconButton size="small" onClick={() => setSuggestionsOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          
          {loadingSuggestions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : suggestions.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {suggestions.map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="outlined"
                  size="small"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  sx={{ 
                    borderRadius: 4, 
                    textTransform: 'none',
                    borderColor: alpha(theme.palette.secondary.main, 0.3),
                    '&:hover': {
                      borderColor: theme.palette.secondary.main,
                      backgroundColor: alpha(theme.palette.secondary.main, 0.1)
                    }
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary" sx={{ py: 1 }}>
              Write a few more sentences to get suggestions...
            </Typography>
          )}
        </Paper>
      )}
      
      {/* Main text editor */}
      <Paper
        elevation={2}
        sx={{
          p: 0,
          borderRadius: 2,
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}
      >
        <TextField
          multiline
          fullWidth
          placeholder="Write your thoughts here..."
          minRows={15}
          maxRows={30}
          value={typeof content === 'string' ? content : ''}
          onChange={handleContentChange}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              padding: 2,
              fontSize: '1rem',
              lineHeight: 1.6,
              backgroundColor: theme.palette.background.paper,
              '& fieldset': {
                border: 'none'
              },
            }
          }}
          // No special key handling - simple text editor
        />
      </Paper>
      
      {/* Footer */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mt: 2 
      }}>
        <Typography variant="body2" color="text.secondary">
          {wordCount} words
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onClose && (
            <Button
              variant="outlined"
              color="inherit"
              onClick={onClose}
            >
              Close
            </Button>
          )}
          
          <Button
            variant="contained"
            color="primary"
            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default SimpleJournalEditor;
