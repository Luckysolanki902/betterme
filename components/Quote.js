import React from 'react';
import { Typography, Box, Paper, useTheme, alpha } from '@mui/material';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { motion } from 'framer-motion';

const Quote = ({ text }) => {
  const theme = useTheme();
  
  if (!text) return null;
  
  return (
    <Paper
      component={motion.div}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      elevation={0}
      sx={{ 
        p: 4,
        mb: 4,
        position: 'relative',
        borderRadius: 3,
        background: `linear-gradient(120deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.secondary.main, 0.06)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        overflow: 'hidden',
        boxShadow: `0 10px 30px ${alpha(theme.palette.primary.main, 0.05)}`,
      }}
    >
      {/* Left quote mark */}
      <Box 
        component={motion.div}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      >
        <FormatQuoteIcon 
          sx={{ 
            position: 'absolute',
            top: '15px',
            left: '15px',
            fontSize: '40px',
            opacity: 0.15,
            color: theme.palette.primary.main,
            transform: 'rotate(180deg)'
          }} 
        />
      </Box>
      
      {/* Right quote mark */}
      <Box 
        component={motion.div}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
      >
        <FormatQuoteIcon 
          sx={{ 
            position: 'absolute',
            bottom: '15px',
            right: '15px',
            fontSize: '40px',
            opacity: 0.15,
            color: theme.palette.primary.main
          }} 
        />
      </Box>
      
      {/* Decorative elements */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: '-30px', 
          left: '-30px', 
          width: '120px', 
          height: '120px', 
          borderRadius: '50%', 
          background: alpha(theme.palette.primary.main, 0.03),
          zIndex: 0
        }}
      />
      
      <Box 
        sx={{ 
          position: 'absolute', 
          bottom: '-40px', 
          right: '-40px', 
          width: '150px', 
          height: '150px', 
          borderRadius: '50%', 
          background: alpha(theme.palette.secondary.main, 0.03),
          zIndex: 0
        }}
      />
      
      <Typography 
        variant="body1" 
        component={motion.p}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        sx={{ 
          fontStyle: 'italic',
          fontWeight: 400,
          color: alpha(theme.palette.text.primary, 0.9),
          lineHeight: 1.7,
          textAlign: 'center',
          maxWidth: '800px',
          mx: 'auto',
          my: 2,
          fontSize: '1.1rem',
          position: 'relative',
          zIndex: 1,
          px: { xs: 2, md: 4 }
        }}
      >
        "{text}"
      </Typography>
    </Paper>
  );
};

export default Quote;
