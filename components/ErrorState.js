// components/ErrorState.js
import React from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  useTheme,
  alpha
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const ErrorState = ({ 
  title = "Something went wrong", 
  message = "We encountered an error while loading your data. Please try again.",
  onRetry,
  retryText = "Try Again",
  severity = "error",
  showDetails = false,
  details = null
}) => {
  const theme = useTheme();

  const getIcon = () => {
    switch (severity) {
      case 'warning':
        return WarningIcon;
      case 'error':
      default:
        return ErrorIcon;
    }
  };

  const IconComponent = getIcon();

  return (
    <Box
      sx={{
        textAlign: 'center',
        py: { xs: 4, sm: 6 },
        px: 3,
      }}
    >
      <Alert 
        severity={severity}
        sx={{
          borderRadius: 4,
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
      >
        <AlertTitle sx={{ fontWeight: 700 }}>
          {title}
        </AlertTitle>
        
        <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
          {message}
        </Typography>

        {onRetry && (
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            size="small"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }
            }}
          >
            {retryText}
          </Button>
        )}

        {showDetails && details && (
          <Box sx={{ mt: 2, textAlign: 'left' }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Error details:
            </Typography>
            <Box
              sx={{
                mt: 1,
                p: 2,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                overflow: 'auto',
                maxHeight: 200
              }}
            >
              {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
            </Box>
          </Box>
        )}
      </Alert>
    </Box>
  );
};

export default ErrorState;
