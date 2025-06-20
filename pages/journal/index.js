// pages/journal/index.js
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Dialog, 
  DialogContent,
  Button, 
  Fab,
  Backdrop,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  alpha,
  Paper,
  Tooltip
} from '@mui/material';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isToday from 'dayjs/plugin/isToday';

// Extend dayjs with plugins
dayjs.extend(isToday);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

import EditIcon from '@mui/icons-material/Edit';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import Layout from '@/components/Layout';
import JournalCalendar from '@/components/journal/JournalCalendar';
import JournalEditor from '@/components/journal/JournalEditor';
import JournalQuote from '@/components/journal/JournalQuote';
import JournalStats from '@/components/journal/JournalStats';
import styles from '@/components/journal/JournalStyles.module.css';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';

const JournalPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // Redirect to welcome if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/welcome');
    }
  }, [isLoaded, user, router]);
  
  // State
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [entriesByDate, setEntriesByDate] = useState({});
  const [daysWithEntries, setDaysWithEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Redirect to welcome if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/welcome');
    }
  }, [isLoaded, user, router]);
  const [suggestionsDialogOpen, setSuggestionsDialogOpen] = useState(false);  const [error, setError] = useState(null);
  const [moodDetected, setMoodDetected] = useState(false);
  const [stats, setStats] = useState({
    totalEntries: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalWords: 0,
    avgWordsPerEntry: 0,
    mostCommonMood: { label: 'neutral', score: 5 },
  });
  // Fetch journal entries for the current month
  const fetchMonthEntries = (date = dayjs()) => {
    setLoading(true);
    setError(null);
    
    // Ensure date is valid
    if (!date || !dayjs(date).isValid()) {
      date = dayjs();
    }
    
    const start = dayjs(date).startOf('month');
    const end = dayjs(date).endOf('month');
    
    fetch(`/api/journal?start=${start.toDate().toISOString()}&end=${end.toDate().toISOString()}`)
      .then(res => {
        if (!res.ok) {
          // Handle different error codes
          if (res.status === 401) {
            // Unauthorized - could be a new user or token expired
            // We'll continue with empty entries rather than showing an error
            setEntriesByDate({});
            setDaysWithEntries([]);
            throw new Error('Skip error');
          }
          throw new Error(`Failed to fetch journal entries: ${res.status}`);
        }
        return res.json();
      })
      .then(entries => {
        // Organize entries by date
        const entriesByDateMap = {};
        const daysWithEntriesList = [];
        
        if (Array.isArray(entries)) {
          entries.forEach(entry => {
            if (entry && entry.entryDate) {
              const entryDate = dayjs(entry.entryDate);
              if (entryDate.isValid()) {
                const dateKey = entryDate.format('YYYY-MM-DD');
                entriesByDateMap[dateKey] = entry;
                daysWithEntriesList.push(entryDate);
              }
            }
          });
        }
        
        setEntriesByDate(entriesByDateMap);
        setDaysWithEntries(daysWithEntriesList);
      })
      .catch(err => {
        if (err.message !== 'Skip error') {
          console.error('Error fetching journal entries:', err);
          setError('Failed to load journal entries. Please try again.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };
  // Fetch journal stats
  const fetchStats = () => {
    setStatsLoading(true);
    
    fetch('/api/journal/stats')
      .then(res => {
        if (!res.ok) {
          // Handle different error codes
          if (res.status === 401) {
            // For new users or unauthorized, show default empty stats
            setStats({
              totalEntries: 0,
              currentStreak: 0,
              longestStreak: 0,
              totalWords: 0,
              avgWordsPerEntry: 0,
              mostCommonMood: { label: 'neutral', score: 5 },
              moodCounts: { neutral: { count: 0, score: 5 } }
            });
            throw new Error('Skip error');
          }
          throw new Error(`Failed to fetch journal statistics: ${res.status}`);
        }
        return res.json();
      })
      .then(statsData => {
        // Validate stats data to prevent rendering errors
        const validatedStats = {
          totalEntries: statsData.totalEntries || 0,
          currentStreak: statsData.currentStreak || 0,
          longestStreak: statsData.longestStreak || 0,
          totalWords: statsData.totalWords || 0,
          avgWordsPerEntry: statsData.avgWordsPerEntry || 0,
          mostCommonMood: statsData.mostCommonMood || { label: 'neutral', score: 5 },
          moodCounts: statsData.moodCounts || { neutral: { count: 0, score: 5 } }
        };
        
        setStats(validatedStats);
      })
      .catch(err => {
        if (err.message !== 'Skip error') {
          console.error('Error fetching journal stats:', err);
          // Use default stats on error
          setStats({
            totalEntries: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalWords: 0,
            avgWordsPerEntry: 0,
            mostCommonMood: { label: 'neutral', score: 5 },
            moodCounts: { neutral: { count: 0, score: 5 } }
          });
        }
      })
      .finally(() => {
        setStatsLoading(false);
      });
  };
    // Initialize data when user is authenticated
  useEffect(() => {
    if (isLoaded && user) {
      fetchMonthEntries(currentMonth);
      fetchStats();
    }
  }, [isLoaded, user]);
  
  // Update entries when month changes
  useEffect(() => {
    if (isLoaded && user) {
      fetchMonthEntries(currentMonth);
    }
  }, [currentMonth, isLoaded, user]);  // Handle date selection
  const handleDateSelect = (date) => {
    const selectedDayjs = dayjs(date);
    setSelectedDate(selectedDayjs);
    
    // Check if an entry exists for this date
    const dateKey = selectedDayjs.format('YYYY-MM-DD');
    const existingEntry = entriesByDate[dateKey];
    
    // Only allow editing today's entry or viewing past entries
    const isToday = selectedDayjs.isToday();
    const isPast = selectedDayjs.isBefore(dayjs(), 'day');
    
    // If it's today or there's an existing entry
    if (isToday || (isPast && existingEntry)) {
      // Navigate to the journal entry page
      if (existingEntry) {
        router.push(`/journal/${existingEntry._id}`);
      } else {
        // Create a new entry for today
        handleCreateTodaysEntry();
      }
    }
  };
  
  // Determine if a date is selectable in the calendar
  const isDateDisabled = (date) => {
    const dateObj = dayjs(date);
    const dateKey = dateObj.format('YYYY-MM-DD');
    
    // Today is always selectable
    if (dateObj.isToday()) return false;
    
    // Future dates are not selectable
    if (dateObj.isAfter(dayjs(), 'day')) return true;
    
    // Past dates are only selectable if they have an entry
    return !entriesByDate[dateKey];
  };
  
  // Handle month change
  const handleMonthChange = (date) => {
    setCurrentMonth(dayjs(date));
  };  // Handle journal entry save
  const handleSaveEntry = (entryData) => {
    return new Promise((resolve, reject) => {
      // Check if this is a new entry or update
      const dateKey = dayjs(selectedDate).format('YYYY-MM-DD');
      const existingEntry = entriesByDate[dateKey];
      const isNewEntry = !existingEntry;
      
      // If the entry is substantial enough and we're updating, try to detect the mood
      if (entryData.content && entryData.content.length > 0 && !moodDetected) {
        // Only detect mood if there's enough content and not already detected
        const wordCount = entryData.wordCount || 0;
        const currentMood = entryData.mood || { label: 'neutral', score: 5 };
        
        // Check if we should try to detect mood
        const shouldDetectMood = 
          wordCount > 50 && // At least 50 words
          (!currentMood.aiDetected || // Not yet AI detected
           !currentMood.lastAnalyzed || // No timestamp for last analysis
           // Or detected more than 10 seconds ago and content has changed
           (Date.now() - new Date(currentMood.lastAnalyzed).getTime() > 10 * 1000));
        
        if (shouldDetectMood) {
          // Additional check for content structure
          if (!Array.isArray(entryData.content) || entryData.content.length === 0) {
            console.warn('Skipping mood detection: entryData.content is not a valid non-empty array. Content:', entryData.content);
            saveEntryToAPI(entryData, isNewEntry, existingEntry, resolve, reject);
            return; // Exit from this path of attempting mood detection
          }

          // Try to detect mood but don't block saving if it fails
          fetch('/api/journal/detect-mood', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: entryData.content })
          })
            .then(moodRes => {
              if (moodRes.ok) {
                return moodRes.json();
              }
              throw new Error('Failed to detect mood');
            })
            .then(moodData => {
              if (moodData && moodData.mood) {
                // Update the entry data with detected mood
                moodData.mood.aiDetected = true;
                moodData.mood.lastAnalyzed = new Date().toISOString();
                entryData.mood = moodData.mood;
                setMoodDetected(true);
                
                // Set a timer to allow mood detection again after 10 seconds
                setTimeout(() => {
                  setMoodDetected(false);
                }, 10000);
              }
              
              // Continue with save regardless of mood detection
              saveEntryToAPI(entryData, isNewEntry, existingEntry, resolve, reject);
            })
            .catch(() => {
              // Continue with save if mood detection fails
              saveEntryToAPI(entryData, isNewEntry, existingEntry, resolve, reject);
            });
        } else {
          // No need to detect mood, just save
          saveEntryToAPI(entryData, isNewEntry, existingEntry, resolve, reject);
        }
      } else {
        // No content or mood already detected, just save
        saveEntryToAPI(entryData, isNewEntry, existingEntry, resolve, reject);
      }
    });
  };
    // Helper function to save entry to API
  const saveEntryToAPI = (entryData, isNewEntry, existingEntry, resolve, reject) => {
    // Check if we have a valid existingEntry with an _id when updating
    if (!isNewEntry && (!existingEntry || !existingEntry._id)) {
      console.error('Cannot update journal entry: Missing entry ID', { existingEntry });
      reject(new Error('Cannot update journal entry: Missing entry ID'));
      return;
    }

    // API endpoint and method
    const url = isNewEntry 
      ? '/api/journal' 
      : `/api/journal/${existingEntry._id}`;
    
    const method = isNewEntry ? 'POST' : 'PUT';
    
    // Make the API request
    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entryData)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to save journal entry');
        }
        
        // Refresh data
        fetchMonthEntries(currentMonth);
        fetchStats();
        
        resolve(true);
      })
      .catch(error => {
        console.error('Error saving journal entry:', error);
        reject(error);
      });
  };
  
  // Handle mood updates from JournalEditor
  const handleUpdateMood = async (content, forceUpdate = false) => {
    try {
      // Only proceed if we have content and it's an array
      if (!Array.isArray(content) || content.length === 0) {
        console.warn('Invalid content format for mood detection');
        return;
      }
      
      // Call the detect-mood API
      const moodResponse = await fetch('/api/journal/detect-mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      
      if (!moodResponse.ok) {
        throw new Error(`Mood detection failed: ${moodResponse.status}`);
      }
      
      const moodData = await moodResponse.json();
      
      if (moodData && moodData.mood) {
        // Set timestamp for cooldowns
        moodData.mood.lastAnalyzed = new Date().toISOString();
        moodData.mood.lastAnalyzedTimestamp = Date.now();
        moodData.mood.aiDetected = true;
        
        // Update the entry with the new mood
        const updatedEntry = {
          ...currentEntry,
          mood: moodData.mood
        };
        
        // Update the current entry in state
        setCurrentEntry(updatedEntry);
        
        // If this is the current day's entry, also update it in the entriesByDate object
        const dateKey = dayjs(selectedDate).format('YYYY-MM-DD');
        setEntriesByDate(prev => ({
          ...prev,
          [dateKey]: updatedEntry
        }));
        
        // If we have an existing entry, save the mood to the API
        if (currentEntry && currentEntry._id) {
          // Save the updated entry
          await fetch(`/api/journal/${currentEntry._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mood: moodData.mood })
          });
        }
        
        // Set mood detected flag to true (will be reset by timer in component)
        setMoodDetected(true);
        setTimeout(() => setMoodDetected(false), 10000);
        
        return moodData.mood;
      }
    } catch (error) {
      console.error('Error updating mood:', error);
    }
  };  // Create new journal entry for today or edit existing one
  const handleCreateTodaysEntry = () => {
    const today = dayjs();
    const todayKey = today.format('YYYY-MM-DD');
    const todaysEntry = entriesByDate[todayKey];
    
    if (todaysEntry) {
      // Navigate to existing entry
      router.push(`/journal/${todaysEntry._id}`);
    } else {
      // Create a new entry and then navigate to it
      const newEntryData = {
        entryDate: today.toISOString(),
        title: '',
        content: {
          editorState: JSON.stringify({
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
        },
        mood: { score: 5, label: 'neutral' }
      };
      
      fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEntryData)
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to create journal entry');
          }
          return response.json();
        })
        .then(data => {
          // Navigate to the new entry
          router.push(`/journal/${data._id}`);
        })
        .catch(error => {
          console.error('Error creating journal entry:', error);
          setError('Failed to create journal entry');
        });
    }
  };
  
  // Handle opening the suggestions dialog
  const handleOpenSuggestions = () => {
    setSuggestionsDialogOpen(true);
  };
  
  return (
    <Layout>
      <Container maxWidth="lg" className={styles.journalContainer}>
          {/* Motivational Quote */}
        <JournalQuote />
        

        
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Main Content Section */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 3,
          mb: 4
        }}>          {/* Calendar Section */}
          <Box sx={{ 
            flex: '0 0 auto', 
            width: { xs: '100%', md: '350px' },
            position: 'sticky',
            top: '80px',
            height: 'fit-content'
          }}>
            <JournalCalendar 
              entriesData={entriesByDate}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
              onMonthChange={handleMonthChange}
              loading={loading}
              shouldDisableDate={isDateDisabled}
            />
          </Box>
          {/* Stats Section */}
          <Box sx={{ flex: 1 }}>
            <Paper 
              elevation={3}
              sx={{ 
                borderRadius: 2,
                p: 3,
                mb: 3,
                background: 'linear-gradient(135deg, #f5f7fa 0%, #f8f9fa 100%)'
              }}
            >
              <Typography 
                variant="h5" 
                component="h2" 
                sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}
              >
                Journal Insights
              </Typography>
              
              {statsLoading ? (
                <Box sx={{ py: 3 }}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      textAlign: 'center', 
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.background.paper, 0.5),
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <CircularProgress size={30} sx={{ opacity: 0.7 }} />
                    </Box>
                    <Typography variant="body1" color="textSecondary" sx={{ fontWeight: 500 }}>
                      Preparing your journal insights...
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1, opacity: 0.7 }}>
                      We're analyzing your writing patterns and journaling habits
                    </Typography>
                  </Paper>
                </Box>
              ) : (
                <JournalStats stats={stats} />
              )}
            </Paper>
          </Box>
        </Box>
                {/* Today's Entry Action Button */}
        <Box sx={{ mb: 3 }}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2
            }}>
              <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    mb: 0.5
                  }}
                >
                  {(() => {
                    const today = dayjs();
                    const todayKey = today.format('YYYY-MM-DD');
                    const todaysEntry = entriesByDate[todayKey];
                    return todaysEntry ? "Edit Today's Entry" : "Write Today's Entry";
                  })()}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    opacity: 0.8
                  }}
                >
                  {(() => {
                    const today = dayjs();
                    const todayKey = today.format('YYYY-MM-DD');
                    const todaysEntry = entriesByDate[todayKey];
                    return todaysEntry 
                      ? `Continue your thoughts from ${today.format('MMMM D, YYYY')}`
                      : `Capture your thoughts for ${today.format('MMMM D, YYYY')}`;
                  })()}
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                size="large"
                startIcon={<EditIcon />}
                onClick={handleCreateTodaysEntry}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                  }
                }}
              >
                {(() => {
                  const today = dayjs();
                  const todayKey = today.format('YYYY-MM-DD');
                  const todaysEntry = entriesByDate[todayKey];
                  return todaysEntry ? "Edit Entry" : "Start Writing";
                })()}
              </Button>
            </Box>
          </Paper>
        </Box>        {/* We've removed the dialog in favor of a dedicated journal entry page */}
        {/* Floating Action
      <Tooltip title="Write today's entry">
        <Fab 
          color="primary" 
          aria-label="new journal entry"
          onClick={handleCreateTodaysEntry}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            boxShadow: '0 8px 16px rgba(66, 99, 235, 0.3)',
          }}
        >
          <EditIcon />
        </Fab>
      </Tooltip>
      
      {/* FAB for getting suggestions - only shown when no entries yet */}
      {stats.totalEntries === 0 && !loading && (
        <Tooltip title="Get writing prompts">
          <Fab
            color="secondary"
            aria-label="suggestions"
            onClick={handleOpenSuggestions}
            sx={{
              position: 'fixed',
              bottom: 96,
              right: 24,
              boxShadow: '0 8px 16px rgba(156, 39, 176, 0.3)',
            }}
          >
            <LightbulbOutlinedIcon />
          </Fab>
        </Tooltip>
      )}
        {/* Empty state for first-time users - only shown when there are no entries ever */}
      {stats.totalEntries === 0 && Object.keys(entriesByDate).length === 0 && !loading && !editorOpen && (        <Paper
          elevation={3}
          sx={{ 
            textAlign: 'center', 
            py: 6, 
            px: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
            borderRadius: 4,
            mt: 4,
            mb: 4,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '5px',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            },
            boxShadow: `0 12px 36px ${alpha(theme.palette.primary.dark, 0.15)}`
          }}
        >
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            Start Your Journaling Journey
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 4, 
              maxWidth: 700, 
              mx: 'auto',
              fontSize: '1.1rem',
              color: alpha(theme.palette.text.primary, 0.9)
            }}
          >
            Regular journaling can improve mental clarity, emotional well-being, and help you track your personal growth over time.
          </Typography>
            <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<EditIcon />}
            onClick={handleCreateTodaysEntry}
            sx={{ 
              mr: 2, 
              mb: { xs: 2, sm: 0 },
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.6)}`,
              }
            }}
          >
            Write Today's Entry
          </Button>
            <Button
            variant="outlined"
            startIcon={<LightbulbOutlinedIcon />}
            onClick={handleOpenSuggestions}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderWidth: '2px',
              borderColor: alpha(theme.palette.secondary.main, 0.5),
              color: theme.palette.secondary.main,
              '&:hover': {
                borderWidth: '2px',
                borderColor: theme.palette.secondary.main,
                backgroundColor: alpha(theme.palette.secondary.main, 0.08),
              }
            }}
          >
            Need Inspiration?
          </Button>
        </Paper>
      )}
      
      {/* Suggestions dialog for new users */}
      <Dialog 
        open={suggestionsDialogOpen}
        onClose={() => setSuggestionsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ px: 3, py: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Journal Prompts to Get You Started
          </Typography>
          
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Here are some prompts to inspire your journaling practice:
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ p: 2, bgcolor: alpha('#4caf50', 0.1), borderRadius: 1 }}>
              <Typography variant="body1">
                What are three things you're grateful for today and why?
              </Typography>
            </Box>
            
            <Box sx={{ p: 2, bgcolor: alpha('#2196f3', 0.1), borderRadius: 1 }}>
              <Typography variant="body1">
                What's one challenge you're currently facing, and what steps could you take to overcome it?
              </Typography>
            </Box>
            
            <Box sx={{ p: 2, bgcolor: alpha('#ff9800', 0.1), borderRadius: 1 }}>
              <Typography variant="body1">
                Reflect on a meaningful conversation or interaction you had recently. What did you learn from it?
              </Typography>
            </Box>
            
            <Box sx={{ p: 2, bgcolor: alpha('#9c27b0', 0.1), borderRadius: 1 }}>
              <Typography variant="body1">
                What's one thing you did today that made you feel proud or accomplished?
              </Typography>
            </Box>
            
            <Box sx={{ p: 2, bgcolor: alpha('#f44336', 0.1), borderRadius: 1 }}>
              <Typography variant="body1">
                How did your emotions fluctuate throughout the day, and what triggered these changes?
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setSuggestionsDialogOpen(false);
                handleCreateTodaysEntry();
              }}
            >
              Start Writing
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
    </Layout>
  );
}

export default JournalPage;
