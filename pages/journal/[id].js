// pages/journal/[id].js - Individual journal entry page
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Dialog, 
  DialogContent,
  DialogTitle,
  Button,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
  alpha,
  Drawer,
  Snackbar,
  Alert,
  Fab,
  Tooltip
} from '@mui/material';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SaveIcon from '@mui/icons-material/Save';
import Layout from '@/components/Layout';
import MoodDisplay from '@/components/journal/MoodDisplay';
import { DEFAULT_MOOD } from '@/utils/moods';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamically import the Lexical editor to avoid SSR issues
const RichTextEditor = dynamic(() => import('../../components/lexical/RichTextEditor'), { 
  ssr: false,
  loading: () => (
    <Box sx={{ 
      height: 'calc(100vh - 300px)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <CircularProgress />
    </Box>
  )
});

const JournalEntryPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State for journal entry data
  const [entry, setEntry] = useState(null);
  const [title, setTitle] = useState('');
  const [editorContent, setEditorContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savingSuccess, setSavingSuccess] = useState(false);
  
  // State for suggestions
  const [suggestionDialog, setSuggestionDialog] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [autoSuggestion, setAutoSuggestion] = useState("Let your thoughts flow — fresh writing prompts appear every 15 seconds to guide your journey.");
  const [showAutoSuggestion, setShowAutoSuggestion] = useState(true);
  const [loadingAutoSuggestion, setLoadingAutoSuggestion] = useState(false);
  const [isAISuggestion, setIsAISuggestion] = useState(false);
  
  // Mood state
  const [mood, setMood] = useState(DEFAULT_MOOD);
  
  // Ref for timers and non-reactive data
  const suggestionTimer = useRef(null);
  const autoSaveInterval = useRef(null);
  
  // Constants
  const AUTO_SUGGESTION_DELAY = 15000; // 15 seconds between suggestion refreshes
  const AUTOSAVE_DELAY = 30000; // 30 seconds for auto-save
  
  // Default suggestions
  const defaultSuggestions = [
    "What made you smile today? Reflect on a moment that brought you joy.",
    "Describe a challenge you faced today. How did you overcome it?",
    "If you could change one thing about today, what would it be and why?",
    "What's something you're grateful for right now?",
    "What's one thing you learned today?",
    "How did you take care of yourself today?",
    "What are you looking forward to tomorrow?",
    "Describe your current mood using colors, textures, or weather.",
    "What's something you accomplished today, no matter how small?",
    "Write about a conversation that stuck with you today.",
    "What made you laugh today?",
    "What's something that challenged your perspective today?",
    "Write a letter to your future self about today.",
    "Let your thoughts flow — don't edit, just write what comes to mind.",
    "What brought you peace today?",
    "Describe a small detail you noticed today that others might have missed."
  ];
  
  // Get random default suggestion
  const getRandomDefaultSuggestion = useCallback(() => {
    return defaultSuggestions[Math.floor(Math.random() * defaultSuggestions.length)];
  }, [defaultSuggestions]);
  
  // Fetch journal entry
  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/journal/${id}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch entry: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          setEntry(data);
          setTitle(data.title || '');
          setEditorContent(data.content?.editorState || null);
          setMood(data.mood || DEFAULT_MOOD);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching journal entry:", err);
          setError("Could not load journal entry");
          setLoading(false);
        });
    }
  }, [id]);
  
  // Setup autosuggest timer
  useEffect(() => {
    // Auto refresh suggestion every 15 seconds
    suggestionTimer.current = setInterval(() => {
      fetchNewSuggestion();
    }, AUTO_SUGGESTION_DELAY);
    
    // Initial suggestion
    fetchNewSuggestion();
    
    return () => {
      if (suggestionTimer.current) {
        clearInterval(suggestionTimer.current);
      }
    };
  }, [editorContent]);
  
  // Setup auto-save timer
  useEffect(() => {
    if (hasChanges) {
      autoSaveInterval.current = setInterval(() => {
        handleSave();
      }, AUTOSAVE_DELAY);
    }
    
    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [hasChanges, editorContent, title]);
  
  // Handle editor content change
  const handleEditorChange = (editorState) => {
    setEditorContent(editorState);
    setHasChanges(true);
  };
  
  // Calculate word count from Lexical editor content
  const calculateWordCount = useCallback(() => {
    if (!editorContent) return 0;
    
    try {
      // Parse the JSON content to extract text
      const parsedContent = JSON.parse(editorContent);
      
      // Function to extract text from all nodes recursively
      const extractTextFromNodes = (nodes) => {
        if (!nodes || !Array.isArray(nodes)) return '';
        
        return nodes.map(node => {
          // Text nodes have text property
          if (node.text) return node.text;
          
          // Recursively extract from children
          if (node.children) return extractTextFromNodes(node.children);
          
          return '';
        }).join(' ');
      };
      
      // Extract text from the root's children
      const text = extractTextFromNodes(parsedContent.root.children);
      
      // Count words
      return text.trim().split(/\s+/).filter(Boolean).length;
    } catch (e) {
      console.error('Error calculating word count:', e);
      return 0;
    }
  }, [editorContent]);
  
  // Fetch new suggestion
  const fetchNewSuggestion = async () => {
    // First set a default suggestion while we fetch a new one
    setAutoSuggestion(getRandomDefaultSuggestion());
    
    // Don't do API call if there's not enough content yet
    if (!editorContent || calculateWordCount() < 10) {
      setIsAISuggestion(false);
      return;
    }
    
    setLoadingAutoSuggestion(true);
    
    try {
      const response = await fetch('/api/journal/suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editorContent }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.suggestion) {
          setAutoSuggestion(data.suggestion);
          setIsAISuggestion(true);
        }
      } else {
        // If API fails, use a default suggestion
        setAutoSuggestion(getRandomDefaultSuggestion());
        setIsAISuggestion(false);
      }
    } catch (error) {
      console.error("Error fetching suggestion:", error);
      setAutoSuggestion(getRandomDefaultSuggestion());
      setIsAISuggestion(false);
    } finally {
      setLoadingAutoSuggestion(false);
    }
  };
  
  // Handle manual request for more suggestions
  const handleOpenSuggestions = async () => {
    setSuggestionDialog(true);
    setLoadingSuggestions(true);
    
    try {
      const response = await fetch('/api/journal/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: editorContent,
          count: 5 
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        } else {
          setSuggestions(defaultSuggestions.slice(0, 5));
        }
      } else {
        setSuggestions(defaultSuggestions.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions(defaultSuggestions.slice(0, 5));
    } finally {
      setLoadingSuggestions(false);
    }
  };
  
  // Handle saving the journal entry
  const handleSave = async (isManualSave = false) => {
    if (!hasChanges && !isManualSave) return;
    
    setIsSaving(true);
    setError('');
    
    // Calculate word count
    const wordCount = calculateWordCount();
    
    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content: { editorState: editorContent },
          wordCount,
          mood
        }),
      });
      
      if (response.ok) {
        setHasChanges(false);
        setSavingSuccess(true);
        setTimeout(() => setSavingSuccess(false), 3000);
      } else {
        setError("Failed to save journal entry");
      }
    } catch (err) {
      console.error("Error saving journal entry:", err);
      setError("Failed to save journal entry");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle mood update
  const handleMoodUpdate = (newMood) => {
    setMood(newMood);
    setHasChanges(true);
  };
  
  // Navigate back to journal calendar
  const handleBack = () => {
    if (hasChanges) {
      // Prompt user to save before leaving
      handleSave(true).then(() => {
        router.push('/journal');
      });
    } else {
      router.push('/journal');
    }
  };
  
  // Format date for display
  const formattedDate = entry ? dayjs(entry.entryDate).format('dddd, MMMM D, YYYY') : '';
  
  return (
    <Layout>
      <Head>
        <title>Journal Entry | {formattedDate}</title>
      </Head>
      
      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh' 
        }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" variant="h6">{error}</Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => router.push('/journal')}
          >
            Back to Journal
          </Button>
        </Box>
      ) : (
        <Container maxWidth="md" sx={{ mb: 10 }}>
          {/* Header with back button and date */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 3,
            pt: 2
          }}>
            <IconButton 
              onClick={handleBack}
              sx={{ mr: 2 }}
            >
              <ChevronLeftIcon />
            </IconButton>
            
            <Typography variant="h5" fontWeight="medium">
              {formattedDate}
            </Typography>
          </Box>
          
          {/* Mood selector */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 3 
          }}>
            <MoodDisplay 
              currentMood={mood}
              onMoodChange={handleMoodUpdate}
              readOnly={false}
            />
          </Box>
          
          {/* Title input */}
          <Box sx={{ mb: 3 }}>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setHasChanges(true);
              }}
              placeholder="Title (optional)"
              style={{
                width: '100%',
                fontSize: '2rem',
                fontWeight: 500,
                padding: '8px 0',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: theme.palette.text.primary,
                fontFamily: theme.typography.fontFamily,
              }}
            />
          </Box>
          
          {/* Editor container */}
          <Paper 
            elevation={0}
            sx={{
              p: 0,
              mb: 4,
              minHeight: 'calc(100vh - 350px)',
              bgcolor: 'transparent',
              border: 'none',
              '& .editor-container': {
                border: 'none',
                pb: 10, // Extra padding for suggestion footer
              }
            }}
          >
            <RichTextEditor
              initialState={editorContent}
              onChange={handleEditorChange}
              placeholder="Start writing your journal entry..."
              height="calc(100vh - 350px)"
              autoFocus
            />
          </Paper>
          
          {/* Word count display */}
          <Box sx={{ 
            position: 'fixed', 
            bottom: 72, 
            right: 24,
            zIndex: 10,
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(8px)',
            boxShadow: 1
          }}>
            <Typography variant="body2" color="text.secondary">
              {calculateWordCount()} words
            </Typography>
          </Box>
          
          {/* Save button */}
          <Box sx={{ 
            position: 'fixed',
            bottom: 120,
            right: 24,
            zIndex: 10
          }}>
            <Tooltip title="Save changes">
              <Fab 
                color="primary" 
                onClick={() => handleSave(true)}
                disabled={isSaving || !hasChanges}
                sx={{
                  boxShadow: theme.shadows[6],
                  bgcolor: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  }
                }}
              >
                {isSaving ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
              </Fab>
            </Tooltip>
          </Box>
          
          {/* Fixed suggestion footer */}
          {showAutoSuggestion && (
            <Paper
              elevation={3}
              sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                py: 2,
                px: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                backdropFilter: 'blur(10px)',
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                zIndex: 10,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LightbulbOutlinedIcon 
                  color={isAISuggestion ? "primary" : "action"} 
                  sx={{ mr: 2, opacity: loadingAutoSuggestion ? 0.5 : 1 }}
                />
                <Typography variant="body1" sx={{ 
                  fontStyle: 'italic',
                  opacity: loadingAutoSuggestion ? 0.7 : 1,
                  animation: loadingAutoSuggestion ? 'pulse 1.5s infinite ease-in-out' : 'none',
                  '@keyframes pulse': {
                    '0%': { opacity: 0.7 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 0.7 },
                  }
                }}>
                  {autoSuggestion}
                </Typography>
              </Box>
              
              <Button
                variant="outlined"
                onClick={handleOpenSuggestions}
                startIcon={<LightbulbOutlinedIcon />}
                size={isMobile ? "small" : "medium"}
                sx={{ whiteSpace: 'nowrap', ml: 2 }}
              >
                See More
              </Button>
            </Paper>
          )}
          
          {/* Suggestions dialog */}
          <Dialog
            open={suggestionDialog}
            onClose={() => setSuggestionDialog(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 2,
                boxShadow: theme.shadows[10]
              }
            }}
          >
            <DialogTitle sx={{ 
              pb: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LightbulbOutlinedIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Journal Prompts</Typography>
              </Box>
              <IconButton onClick={() => setSuggestionDialog(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            
            <DialogContent dividers>
              {loadingSuggestions ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box>
                  {suggestions.map((suggestion, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.primary.main, 0.1)
                          : alpha(theme.palette.primary.light, 0.1),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark'
                            ? alpha(theme.palette.primary.main, 0.15)
                            : alpha(theme.palette.primary.light, 0.15),
                        }
                      }}
                      onClick={() => {
                        setAutoSuggestion(suggestion);
                        setSuggestionDialog(false);
                      }}
                    >
                      <Typography variant="body1">
                        {suggestion}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </DialogContent>
          </Dialog>
          
          {/* Success notification */}
          <Snackbar
            open={savingSuccess}
            autoHideDuration={3000}
            onClose={() => setSavingSuccess(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setSavingSuccess(false)} 
              severity="success"
              variant="filled"
              sx={{ width: '100%' }}
            >
              Journal entry saved successfully
            </Alert>
          </Snackbar>
        </Container>
      )}
    </Layout>
  );
};

export default JournalEntryPage;
