// components/journal/JournalCalendar.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  useTheme,
  alpha,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DateCalendar, PickersDay } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isToday from 'dayjs/plugin/isToday';

// Extend dayjs with plugins
dayjs.extend(isToday);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

import styles from './JournalStyles.module.css';

// Custom calendar day component to highlight days with entries
const CustomDay = ({ 
  day, 
  outsideCurrentMonth, 
  entriesData, 
  selectedDate,
  ...props 
}) => {
  const theme = useTheme();
    // Find entry for this day if it exists - ensure day is valid
  const dayFormatted = day && day.isValid() ? day.format('YYYY-MM-DD') : null;
  const dayEntry = entriesData && dayFormatted ? entriesData[dayFormatted] : null;
  const hasEntry = !!dayEntry;
  
  // Get the mood color for this day if it has an entry
  const getMoodStyle = () => {
    if (!hasEntry || !dayEntry.mood) return {};
    
    // Use the mood score to determine the color
    let moodColor;
    const score = dayEntry.mood.score;
    
    if (score >= 8) moodColor = theme.palette.success.main; // Happy/Excited
    else if (score >= 6) moodColor = theme.palette.info.main; // Positive
    else if (score >= 4) moodColor = theme.palette.warning.main; // Neutral
    else moodColor = theme.palette.error.main; // Negative
    
    return {
      backgroundColor: moodColor,
      color: theme.palette.getContrastText(moodColor),
      borderRadius: '50%'
    };
  };
    // Style for the selected date - ensure both dates are valid
  const isSelected = selectedDate && day && day.isValid() && dayjs(selectedDate).isValid() 
    ? day.isSame(dayjs(selectedDate), 'day') 
    : false;
  const selectedStyle = isSelected ? {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
    borderRadius: '50%'
  } : {};
  // Style for today's date - ensure day is valid
  const isToday = day && day.isValid() && day.isToday();
  const isTodayStyle = isToday && !isSelected ? {
    border: `2px solid ${theme.palette.primary.main}`,
    borderRadius: '50%',
    fontWeight: 'bold',
    backgroundColor: hasEntry ? undefined : alpha(theme.palette.primary.light, 0.15)
  } : {};
    // Is date disabled (for past dates with no entries or future dates)
  const isDisabled = props.disabled;
  
  // Style for disabled dates
  const disabledStyle = isDisabled ? {
    opacity: 0.4,
    textDecoration: isToday ? 'none' : 'line-through',
    color: theme.palette.text.disabled
  } : {};
  
  return (
    <PickersDay 
      {...props} 
      day={day} 
      outsideCurrentMonth={outsideCurrentMonth} 
      sx={{
        ...getMoodStyle(),
        ...selectedStyle,
        ...isTodayStyle,
        ...disabledStyle,
        position: 'relative',
        margin: '2px',
        height: '36px',
        width: '36px',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: !isDisabled && (hasEntry 
            ? alpha(theme.palette.primary.main, 0.8) 
            : isSelected
              ? alpha(theme.palette.secondary.main, 0.8)
              : alpha(theme.palette.action.hover, 0.8)),
          transform: !isDisabled ? 'scale(1.1)' : 'none'
        }
      }}
    />
  );
};

// Calendar component for journal entries
const JournalCalendar = ({ 
  entriesData = {},
  onDateSelect, 
  selectedDate = dayjs(),
  loading = false,
  shouldDisableDate = null
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Ensure selected date is valid
  const validSelectedDate = (selectedDate && dayjs(selectedDate).isValid()) 
    ? dayjs(selectedDate) 
    : dayjs();
  const [activeMonth, setActiveMonth] = useState(validSelectedDate.startOf('month'));
  
  // Handle month view change
  const handleMonthChange = (newMonth) => {
    setActiveMonth(dayjs(newMonth).startOf('month'));
  };
    return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper 
        elevation={0} 
        className={styles.calendarContainer}
        sx={{
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          py: 1,
          position: 'relative',
        }}
      >
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 1,
              borderRadius: '12px',
            }}
          >
            <CircularProgress />
          </Box>
        )}<Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            {activeMonth.format('MMMM YYYY')}
          </Typography>
        </Box>        <DateCalendar
          value={validSelectedDate}
          onChange={onDateSelect}
          onMonthChange={handleMonthChange}
          shouldDisableDate={shouldDisableDate}
          slots={{
            day: (props) => (
              <CustomDay 
                {...props} 
                entriesData={entriesData}
                selectedDate={validSelectedDate}
              />
            )
          }}
          sx={{
            '.MuiDayCalendar-header': {
              justifyContent: 'space-around',
            },
            '.MuiDayCalendar-weekContainer': {
              justifyContent: 'space-around',
              margin: '0 auto',
            },
            width: '100%',
            maxWidth: '100%',
            height: isMobile ? 'auto' : 360,
            '& .MuiPickersDay-root': {
              fontSize: '0.875rem',
            },
          }}
        />
      </Paper>
    </LocalizationProvider>
  );
};

export default JournalCalendar;
