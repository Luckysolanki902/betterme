import React from 'react';
import { Typography } from '@mui/material';

const Quote = ({ text }) => {
  return (
    <Typography variant="h6" component="p" style={{ fontStyle: 'italic', textAlign: 'center' }}>
      "{text}"
    </Typography>
  );
};

export default Quote;
