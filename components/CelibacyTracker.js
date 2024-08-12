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
  Container,
  useMediaQuery
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import Dashboard from './Dashboard';
import styles from '@/styles/Home.module.css'
import { differenceInDays } from 'date-fns';




const getMonthName = (num) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[num - 1];
}

function formatDate(date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toDateString();
  }
}

const startDate = new Date('2024-08-12');

const CelibacyTracker = ({ year, month }) => {
  const [dailyRecords, setDailyRecords] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success' or 'error'
  const [headingDate, setHeadingDate] = useState(new Date(year, month - 1, new Date().getDate()));
  const today = new Date(year, month - 1, new Date().getDate());
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
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
    const selectedDate = new Date(year, month - 1, day);
    if (selectedDate <= today) {
      setSelectedDay(day);
      setHeadingDate(selectedDate);
    }
  };

  const todayD = new Date();
  const dayCount = differenceInDays(todayD, startDate) + 1;

  return (
    <Container className={styles.homeContainer} maxWidth="md">
      <Box sx={{ padding: 2, fontFamily: 'Arial, sans-serif' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: !isSmallScreen ? '0 0rem' : '0' }}>

          <Typography className='pop' variant="h3" gutterBottom sx={{ marginBottom: '2rem' }}>
            {getMonthName(month)}
          </Typography>

          <Typography className='pop' variant="h3" gutterBottom sx={{ marginBottom: '2rem', display:'flex', alignItems:'center' }}>
            <LocalFireDepartmentIcon sx={{fontSize:'3rem', color:'#f57f17'}} />
            {dayCount}
          </Typography>
        </Box>
        <Grid container spacing={2}> {/* Adjust spacing if needed */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const isFutureDate = new Date(year, month - 1, day) > today;
            return (
              <Grid
                item
                xs={2}
                sm={2}
                md={2}
                lg={2}
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Box
                  onClick={() => !isFutureDate && handleDayClick(day)}
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isFutureDate ? 'not-allowed' : 'pointer',
                    opacity: isFutureDate ? 0.5 : 1,
                    boxShadow: selectedDay === day ? '0px 4px 8px rgba(0, 0, 0, 0.3)' : 'none',
                  }}
                >
                  {getColorForIcon(day) !== 'grey' ? (
                    <LocalFireDepartmentIcon
                      sx={{
                        color: getColorForIcon(day),
                        fontSize: '2rem',
                      }}
                    />
                  ) : (
                    <Typography className='pop' variant="body1" sx={{ textAlign: 'center' }}>
                      {day}
                    </Typography>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
        <Typography className='pop' variant="h5" gutterBottom sx={{ marginTop: '4rem', marginBottom: '2rem' }}>
          {formatDate(headingDate)}
        </Typography>
        <Box sx={{ marginBottom: 2, display: 'flex', flexDirection: 'column', alignItems: 'start', fontFamily: 'Poppins' }}>
          <FormControlLabel
            className='pop'

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
            className='pop'

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
            className='pop'
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
