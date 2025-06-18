// components/journal/CustomDatePicker.js
import React from 'react';
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// This wrapper eliminates the defaultProps warning in MUI x-date-pickers
export const CustomDateCalendar = (props) => {
  return <DateCalendar {...props} />;
};

export const CustomLocalizationProvider = ({ children, ...props }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} {...props}>
      {children}
    </LocalizationProvider>
  );
};
