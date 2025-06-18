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
import { PickersDay } from '@mui/x-date-pickers';
import { CustomLocalizationProvider, CustomDateCalendar } from './CustomDatePicker';
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
      borderRadius: '50%',
      boxShadow: `0 2px 8px ${alpha(moodColor, 0.4)}`,
      transform: 'scale(1.05)',
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
  } : {};  return (
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
        height: '38px',
        width: '38px',
        borderRadius: '50%',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        fontWeight: hasEntry ? 600 : 400,
        '&:hover': {
          transform: hasEntry ? 'scale(1.15)' : 'scale(1.05)', 
          boxShadow: hasEntry 
            ? `0 3px 10px ${alpha(theme.palette.primary.main, 0.5)}`
            : `0 2px 8px ${alpha(theme.palette.grey[500], 0.3)}`,
        },
        boxShadow: hasEntry ? `0 2px 6px ${alpha(theme.palette.primary.main, 0.15)}` : 'none',
        '&:hover': {
          backgroundColor: !isDisabled && (hasEntry
            ? alpha(theme.palette.primary.main, 0.8)
            : isSelected
              ? alpha(theme.palette.secondary.main, 0.8)
              : alpha(theme.palette.action.hover, 0.8)),
          transform: !isDisabled ? 'scale(1.12)' : 'none',
          zIndex: 10,
          boxShadow: hasEntry ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}` : 'none'
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
  };  return (
    <CustomLocalizationProvider>      <Paper
        elevation={2}
        className={styles.calendarContainer}          sx={{
            backgroundColor: alpha(theme.palette.background.paper, 1),
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: `0 16px 48px ${alpha(theme.palette.primary.main, 0.2)}`,
              transform: 'translateY(-5px)',
            }
          }}
      >
        {/* Loading overlay */}
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
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              zIndex: 10,
              backdropFilter: 'blur(4px)',
              borderRadius: '12px',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={40} sx={{ color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="body2" color="textSecondary">
                Loading your journal...
              </Typography>
            </Box>
          </Box>
        )}
        
        <CustomDateCalendar
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
              '& .MuiTypography-root': {
                fontWeight: 600,
                color: theme.palette.primary.main
              }
            },
            '.MuiDayCalendar-weekContainer': {
              justifyContent: 'space-around',
              margin: '8px auto',
            },
            width: '100%',
            maxWidth: '100%',
            height: isMobile ? 'auto' : 360,
            '& .MuiPickersDay-root': {
              fontSize: '0.9rem',
              fontWeight: 500,
            },
            '& .MuiPickersFadeTransitionGroup-root': {
              '& .MuiDateCalendar-viewTransitionContainer': {
                borderRadius: '12px',
                overflow: 'hidden'
              }
            },
            '& .MuiPickersCalendarHeader-root': {
              paddingLeft: 2,
              paddingRight: 2,
              '& .MuiPickersCalendarHeader-label': {
                fontWeight: 600,
                fontSize: '1.1rem',
                color: theme.palette.primary.dark
              },
              '& .MuiPickersArrowSwitcher-button': {
                color: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                }
              }
            },
            '& .MuiPickersSlideTransition-root': {
              minHeight: 260
            }
          }}
        />
      </Paper>
    </CustomLocalizationProvider>
  );
};

export default JournalCalendar;
