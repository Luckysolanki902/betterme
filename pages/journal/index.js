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

const JournalPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    // State
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [entriesByDate, setEntriesByDate] = useState({});
  const [daysWithEntries, setDaysWithEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
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
  
  // Initialize data
  useEffect(() => {
    fetchMonthEntries(currentMonth);
    fetchStats();
  }, []);
  
  // Update entries when month changes
  useEffect(() => {
    fetchMonthEntries(currentMonth);
  }, [currentMonth]);
  // Handle date selection
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
      setCurrentEntry(existingEntry || null);
      setEditorOpen(true);
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
  };
 
  // Create new journal entry for today
  const handleCreateTodaysEntry = () => {
    const today = dayjs();
    setSelectedDate(today);
    setCurrentEntry(null);
    setEditorOpen(true);
  };
  
  // Handle opening the suggestions dialog
  const handleOpenSuggestions = () => {
    setSuggestionsDialogOpen(true);
  };
  
  return (
    <Layout>
      <Container maxWidth="lg" className={styles.journalContainer}>
        <Box className={styles.pageHeader}>
          <Typography variant="h4" component="h1" gutterBottom>
            My Journal
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Reflect, remember, and grow with daily journaling
          </Typography>
        </Box>
        
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
        }}>
          {/* Calendar Section */}
          <Box sx={{ 
            flex: '0 0 auto', 
            width: { xs: '100%', md: '350px' }
          }}>
            <Paper
              elevation={3} 
              sx={{ 
                borderRadius: 2,
                overflow: 'hidden',
                position: 'sticky',
                top: '80px'
              }}
            >
              <Box sx={{ p: 2, bgcolor: theme.palette.primary.main, color: 'white' }}>
                <Typography variant="h6" align="center">
                  Journal Calendar
                </Typography>
              </Box>
              <JournalCalendar 
                entriesData={entriesByDate}
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
                onMonthChange={handleMonthChange}
                loading={loading}
                shouldDisableDate={isDateDisabled}
              />
            </Paper>
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
        
        {/* Journal Entry Editor Dialog */}
        <Dialog
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            elevation: 3,
            sx: {
              borderRadius: { xs: 0, sm: 2 },
              maxHeight: '90vh'
            }
          }}
        >
          <DialogContent sx={{ p: { xs: 1, sm: 3 } }}>
            <JournalEditor
              date={selectedDate}
              entry={currentEntry}
              onSave={handleSaveEntry}
              onClose={() => setEditorOpen(false)}
              onUpdateMood={handleUpdateMood}
          />
        </DialogContent>
      </Dialog>
        {/* Floating Action Button for New Entry */}
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
      
      {/* Empty state for first-time users */}
      {stats.totalEntries === 0 && !loading && !editorOpen && (
        <Paper
          elevation={3}
          sx={{ 
            textAlign: 'center', 
            py: 6, 
            px: 3,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            borderRadius: 2,
            mt: 4,
            mb: 4
          }}
        >
          <Typography variant="h5" gutterBottom>
            Start Your Journaling Journey
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            Regular journaling can improve mental clarity, emotional well-being, and help you track your personal growth over time.
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<EditIcon />}
            onClick={handleCreateTodaysEntry}
            sx={{ mr: 2, mb: { xs: 2, sm: 0 } }}
          >
            Write Today's Entry
          </Button>
            <Button
            variant="outlined"
            startIcon={<LightbulbOutlinedIcon />}
            onClick={handleOpenSuggestions}
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
