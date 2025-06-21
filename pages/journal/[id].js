// pages/journal/[id].js - Individual journal entry page
import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Button,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
  alpha,
  Snackbar,
  Alert,
  Paper,
} from '@mui/material';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Layout from '@/components/Layout';
import SimpleJournalEditor from '@/components/journal/SimpleJournalEditor';
import MoodDisplay from '@/components/journal/MoodDisplay';
import { DEFAULT_MOOD } from '@/utils/moods';
import Head from 'next/head';

const JournalEntryPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State for journal entry data
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingSuccess, setSavingSuccess] = useState(false);
  
  // Fetch entry data
  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    fetch(`/api/journal/${id}`)
      .then(res => {
        if (!res.ok) {
          throw new Error("Could not fetch journal entry");
        }
        return res.json();
      })
      .then(data => {
        setEntry(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching journal entry:", err);
        setError("Could not load journal entry");
        setLoading(false);
      });
  }, [id]);
  
  // Handle entry save
  const handleSave = async (entryData) => {
    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save journal entry');
      }
      
      // Get updated entry
      const updatedEntry = await response.json();
      setEntry(updatedEntry);
      
      // Show success message
      setSavingSuccess(true);
      setTimeout(() => setSavingSuccess(false), 3000);
      
      return true;
    } catch (error) {
      console.error("Error saving journal entry:", error);
      throw error;
    }
  };
  
  // Handle mood update
  const handleUpdateMood = async (newMood) => {
    if (!entry) return;
    
    try {
      await fetch(`/api/journal/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mood: newMood }),
      });
    } catch (error) {
      console.error("Error updating mood:", error);
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    router.push('/journal');
  };
  
  // Format date for display
  const formattedDate = entry ? dayjs(entry.entryDate).format('dddd, MMMM D, YYYY') : '';
  
  return (
    <Layout>
      <Head>
        <title>Journal Entry | {formattedDate}</title>
      </Head>
      
      <Container maxWidth="md">
        {/* Back button */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 3 }}>
          <Button
            startIcon={<ChevronLeftIcon />}
            onClick={handleBack}
            sx={{ textTransform: 'none' }}
          >
            Back to Calendar
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '60vh' 
          }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper
            elevation={2}
            sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}
          >
            <Typography color="error" variant="h6" gutterBottom>
              {error}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleBack}
              sx={{ mt: 2 }}
            >
              Return to Journal
            </Button>
          </Paper>
        ) : (
          <>
            {/* Journal Editor */}
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                mb: 3,
                background: theme.palette.background.paper
              }}
            >
              <SimpleJournalEditor
                entry={entry}
                onSave={handleSave}
                onUpdateMood={handleUpdateMood}
                date={entry.entryDate}
              />
            </Paper>
            
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
          </>
        )}
      </Container>
    </Layout>
  );
};

export default JournalEntryPage;
