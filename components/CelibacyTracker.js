import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  Typography,
  Snackbar,
  Alert,
  Container
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import Dashboard from './Dashboard';
import styles from '@/styles/Home.module.css'

const CelibacyTracker = ({ year, month }) => {
  const [dailyRecords, setDailyRecords] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success' or 'error'
  const [headingDate, setHeadingDate] = useState(new Date(year, month - 1, new Date().getDate()));

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const { data } = await axios.get(`/api/celibacy/${year}/${month}`);
        if (data.success && data.data) {
          setDailyRecords(data.data.dailyRecords);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchRecords();
  }, [year, month]);

  const handleCheckboxChange = async (index, field) => {
    const newRecords = [...dailyRecords];
    if (!newRecords[index]) {
      newRecords[index] = {
        date: new Date(year, month - 1, index + 1),
        celibacy: false,
        NotFallInTrap: false,
        notSearchForLustfulContent: false
      };
    }
    newRecords[index][field] = !newRecords[index][field];
    setDailyRecords(newRecords);

    try {
      await axios.post(`/api/celibacy/${year}/${month}`, { dailyRecords: newRecords });
      setSnackbarMessage('Record updated successfully!');
      setSnackbarSeverity('success');
    } catch (error) {
      console.error(error);
      setSnackbarMessage('Failed to update record.');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const getColorForIcon = (day) => {
    const record = dailyRecords[day - 1];
    if (!record) return 'grey';

    const { celibacy, NotFallInTrap, notSearchForLustfulContent } = record;
    const count = [celibacy, NotFallInTrap, notSearchForLustfulContent].filter(Boolean).length;
    if (count === 1) return '#ffeb3b'; // Yellow
    if (count === 2) return '#fbc02d'; // Amber
    if (count === 3) return '#f57f17'; // Orange
    return 'grey';
  };

  const daysInMonth = new Date(year, month, 0).getDate();

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setHeadingDate(new Date(year, month - 1, day));
  };

  return (
    <Container className={styles.homeContainer} maxWidth="md">
      <Box sx={{ padding: 2, fontFamily: 'Arial, sans-serif' }}>
        <Typography variant="h4" gutterBottom sx={{ marginBottom: '2rem' }}>
          Celibacy Tracker for {month}/{year}
        </Typography>
        <Grid container spacing={2}>
          {Array.from({ length: daysInMonth }).map((_, index) => (
            <Grid item xs={1.5} sm={1.5} md={1.5} lg={1.5} key={index}>
              <Box
                onClick={() => handleDayClick(index + 1)}
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  margin: 'auto',
                }}
              >
                <LocalFireDepartmentIcon
                  sx={{
                    color: getColorForIcon(index + 1),
                    fontSize: '2rem',
                  }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
        <Typography variant="h5" gutterBottom sx={{ marginTop: '4rem', marginBottom: '2rem' }}>
          {`Selected Day: ${headingDate.toDateString()}`}
        </Typography>
        <Box sx={{ marginBottom: 2, display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={dailyRecords[selectedDay - 1]?.celibacy || false}
                onChange={() => handleCheckboxChange(selectedDay - 1, 'celibacy')}
                sx={{
                  '&.Mui-checked': {
                    color: '#4caf50',
                  },
                }}
              />
            }
            label="Celibacy"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={dailyRecords[selectedDay - 1]?.NotFallInTrap || false}
                onChange={() => handleCheckboxChange(selectedDay - 1, 'NotFallInTrap')}
                sx={{
                  '&.Mui-checked': {
                    color: '#ff9800',
                  },
                }}
              />
            }
            label="Didn't Fall In Trappy Thoughts"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={dailyRecords[selectedDay - 1]?.notSearchForLustfulContent || false}
                onChange={() => handleCheckboxChange(selectedDay - 1, 'notSearchForLustfulContent')}
                sx={{
                  '&.Mui-checked': {
                    color: '#f44336',
                  },
                }}
              />
            }
            label="Didn't Search For Lustful Content"
          />
        </Box>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
        <Dashboard currentPage={'celibacy'} />
      </Box>
    </Container>
  );
};

export default CelibacyTracker;
