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
  useMediaQuery,
  TextField
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import Dashboard from './Dashboard';
import styles from '@/styles/Home.module.css';
import { differenceInDays } from 'date-fns';
import { useStartDate } from '@/contexts/StartDateContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const getMonthName = (num) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[num - 1];
};

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

const CelibacyTracker = () => {
  const startDate = useStartDate();
  const [dailyRecords, setDailyRecords] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedDate, setSelectedDate] = useState(dayjs()); // Initialize with current date
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success' or 'error'
  const [headingDate, setHeadingDate] = useState(new Date());
  const today = new Date();
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  const [totalDaysSinceStart, setTotalDaysSinceStart] = useState(0); // For overall days since the earliest level

  const fetchRecords = async (year, month) => {
    try {
      const { data } = await axios.get(`/api/celibacy/${year}/${month}`);
      if (data.success && data.data) {
        setDailyRecords(data.data.dailyRecords);
      }
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    const diffInDays = differenceInDays(new Date(), startDate) + 1;
    setTotalDaysSinceStart(diffInDays);
  }, [startDate])

  const fetchLevels = async () => {
    const res = await fetch('/api/levels');
    const data = await res.json();
    calculateTotalDaysSinceStart(data);
  };

  const calculateTotalDaysSinceStart = (levelsData) => {
    if (levelsData.length > 0) {
      const earliestStartDate = new Date(levelsData[0].startDate);
      const currentDate = new Date();
      const diffInTime = currentDate - earliestStartDate;
      const diffInDays = Math.floor(diffInTime / (1000 * 60 * 60 * 24));
      setTotalDaysSinceStart(diffInDays + 1);
    }
  };

  useEffect(() => {
    const year = selectedDate.year();
    const month = selectedDate.month() + 1; // Month is 0-indexed in dayjs
    fetchLevels();
    fetchRecords(year, month);
  }, [selectedDate]);

  const handleCheckboxChange = async (index, field) => {
    const newRecords = [...dailyRecords];
    if (!newRecords[index]) {
      newRecords[index] = {
        date: new Date(selectedDate.year(), selectedDate.month(), index + 1),
        celibacy: false,
        NotFallInTrap: false,
        notSearchForLustfulContent: false,
      };
    }
    newRecords[index][field] = !newRecords[index][field];
    setDailyRecords(newRecords);

    try {
      await axios.post(`/api/celibacy/${selectedDate.year()}/${selectedDate.month() + 1}`, { dailyRecords: newRecords });
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

  const daysInMonth = selectedDate.daysInMonth();

  const handleDayClick = (day) => {
    const selectedFullDate = new Date(selectedDate.year(), selectedDate.month(), day);
    if (selectedFullDate <= today) {
      setSelectedDay(day);
      setHeadingDate(selectedFullDate);
    }
  };

  const todayD = new Date();

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container className={styles.homeContainer} maxWidth="md">
        <Box sx={{ padding: 2, fontFamily: 'Arial, sans-serif' }}>
          {/* DatePicker to select year and month */}


          <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: !isSmallScreen ? '0 0rem' : '0' }}>
            <Typography className="pop" variant="h3" gutterBottom sx={{ marginBottom: '2rem' }}>
              {getMonthName(selectedDate.month() + 1)}
            </Typography>
            <Typography className="pop" variant="h3" gutterBottom sx={{ marginBottom: '2rem', display: 'flex', alignItems: 'center' }}>
              <LocalFireDepartmentIcon sx={{ fontSize: '3rem', color: '#f57f17' }} />
              {totalDaysSinceStart}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'left', mb: 2 }}>
            <DatePicker
              views={['year', 'month']}
              label="Select Month and Year"
              value={selectedDate}
              minDate={dayjs(startDate)} // Restrict based on start date
              maxDate={dayjs()} // Restrict to today or earlier
              onChange={(newValue) => setSelectedDate(newValue)}
              renderInput={(params) => <TextField {...params} />}
            />
          </Box>

          <Grid container spacing={2}>
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const isFutureDate = new Date(selectedDate.year(), selectedDate.month(), day) > today;
              return (
                <Grid
                  item
                  xs={2}
                  sm={2}
                  md={2}
                  lg={2}
                  key={index}
                  sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
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
                        sx={{ color: getColorForIcon(day), fontSize: '2rem' }}
                      />
                    ) : (
                      <Typography className="pop" variant="body1" sx={{ textAlign: 'center' }}>
                        {day}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          <Typography className="pop" variant="h5" gutterBottom sx={{ marginTop: '4rem', marginBottom: '2rem' }}>
            {formatDate(headingDate)}
          </Typography>
          <Box sx={{ marginBottom: 2, display: 'flex', flexDirection: 'column', alignItems: 'start', fontFamily: 'Poppins' }}>
            <FormControlLabel
              className="pop"
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
              className="pop"
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
              className="pop"
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
    </LocalizationProvider>
  );
};

export default CelibacyTracker;
