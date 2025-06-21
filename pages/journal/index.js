// pages/journal/index.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Fab,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  alpha,
  Paper,
  Tooltip,
  Skeleton,
  Grid
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
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StraightenIcon from '@mui/icons-material/Straighten';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BookIcon from '@mui/icons-material/Book';
import Layout from '@/components/Layout';
import JournalCalendar from '@/components/journal/JournalCalendar';
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
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
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
  }, [currentMonth, isLoaded, user]);

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
  };

  // Create new journal entry for today
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
        content: ''
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

  // Loading state
  if (!isLoaded) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box className={styles.journalContainer}>
        {/* Hero Section with Quote */}
        <Box
          sx={{
            m: 'auto',
            mb: 4,
            maxWidth: '800px',
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.05)} 0%, ${alpha(theme.palette.secondary.dark, 0.08)} 100%)`,
          }}
        >
          <JournalQuote />
        </Box>

        <Container maxWidth="lg">
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Stats Cards Section */}
          <Box sx={{ mb: 4 }}>
            {statsLoading ? (
              <Grid container spacing={2}>
                {Array.from(new Array(4)).map((_, index) => (
                  <Grid item xs={6} md={3} key={index}>
                    <Skeleton
                      variant="rounded"
                      height={120}
                      sx={{ borderRadius: 3 }}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.light, 0.12)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                      <CalendarMonthIcon sx={{ fontSize: 32, color: theme.palette.primary.main, opacity: 0.8 }} />
                    </Box>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {stats.totalEntries}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Entries
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} md={3}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.light, 0.12)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.12)}`
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                      <StraightenIcon sx={{ fontSize: 32, color: theme.palette.success.main, opacity: 0.8 }} />
                    </Box>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {stats.currentStreak}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Day Streak
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} md={3}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.info.light, 0.12)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                      <BookIcon sx={{ fontSize: 32, color: theme.palette.info.main, opacity: 0.8 }} />
                    </Box>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {stats.totalWords.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Words Written
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} md={3}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.light, 0.12)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.12)}`
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                      <AutoAwesomeIcon sx={{ fontSize: 32, color: theme.palette.secondary.main, opacity: 0.8 }} />
                    </Box>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {stats.avgWordsPerEntry}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Words per Entry
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>

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
              width: { xs: '100%', md: '350px' },
              position: { xs: 'static', md: 'sticky' },
              top: '80px',
              height: 'fit-content'
            }}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  overflow: 'hidden',
                  background: theme.palette.background.paper
                }}
              >
                {loading ? (
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : (
                  <JournalCalendar
                    entriesData={entriesByDate}
                    onDateSelect={handleDateSelect}
                    selectedDate={selectedDate}
                    onMonthChange={handleMonthChange}
                    loading={loading}
                    shouldDisableDate={isDateDisabled}
                  />
                )}
              </Paper>
            </Box>

            {/* Today's Entry & Stats Section */}
            <Box sx={{ flex: 1 }}>
              {/* Today's Entry Action Button */}
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.07)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {(() => {
                        const today = dayjs();
                        const todayKey = today.format('YYYY-MM-DD');
                        const todaysEntry = entriesByDate[todayKey];
                        return todaysEntry ? "Continue Today's Entry" : "Start Today's Journal";
                      })()}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {dayjs().format('dddd, MMMM D, YYYY')}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={handleCreateTodaysEntry}
                    sx={{
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                    }}
                  >
                    {(() => {
                      const today = dayjs();
                      const todayKey = today.format('YYYY-MM-DD');
                      const todaysEntry = entriesByDate[todayKey];
                      return todaysEntry ? "Continue Writing" : "Start Writing";
                    })()}
                  </Button>
                </Box>
              </Paper>

              {/* Stats Section */}
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: theme.palette.background.paper,
                }}
              >
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{ mb: 3, fontWeight: 600 }}
                >
                  Journal Insights
                </Typography>

                {statsLoading ? (
                  <Box sx={{ py: 3 }}>
                    <Skeleton variant="rounded" height={150} sx={{ borderRadius: 2 }} />
                  </Box>
                ) : (
                  <JournalStats stats={stats} />
                )}
              </Paper>
            </Box>
          </Box>

          {/* Empty state for first-time users */}
          {stats.totalEntries === 0 && Object.keys(entriesByDate).length === 0 && !loading && (
            <Paper
              elevation={3}
              sx={{
                textAlign: 'center',
                py: 6,
                px: 4,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                borderRadius: 4,
                mt: 4,
                mb: 4,
              }}
            >
              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
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
                Create Your First Entry
              </Button>
            </Paper>
          )}
        </Container>
      </Box>
    </Layout>
  );
};

export default JournalPage;
