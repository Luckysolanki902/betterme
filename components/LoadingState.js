// components/LoadingState.js
import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Skeleton,
  Card,
  CardContent,
  useTheme,
  alpha
} from '@mui/material';
import { motion } from 'framer-motion';

const LoadingState = ({ 
  type = "default", // "default", "todos", "cards", "skeleton"
  message = "Loading...",
  count = 3
}) => {
  const theme = useTheme();

  if (type === "skeleton") {
    return (
      <Box sx={{ width: '100%' }}>
        {Array.from({ length: count }).map((_, index) => (
          <Card 
            key={index} 
            elevation={0}
            sx={{ 
              mb: 2, 
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={24} height={24} sx={{ mr: 2 }} />
                <Skeleton variant="text" width="60%" height={24} />
                <Box sx={{ flexGrow: 1 }} />
                <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
              </Box>
              <Skeleton variant="text" width="40%" height={16} />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  if (type === "cards") {
    return (
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {Array.from({ length: count }).map((_, index) => (
          <Card 
            key={index}
            elevation={0}
            sx={{ 
              flex: 1,
              minWidth: 200,
              borderRadius: 4,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Skeleton variant="circular" width={46} height={46} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="40%" height={16} />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  if (type === "todos") {
    return (
      <Box sx={{ width: '100%' }}>
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              elevation={0}
              sx={{ 
                mb: 2, 
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                background: alpha(theme.palette.background.paper, 0.8)
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Skeleton 
                    variant="circular" 
                    width={24} 
                    height={24} 
                    sx={{ 
                      mr: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }} 
                  />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton 
                      variant="text" 
                      width={`${60 + Math.random() * 30}%`} 
                      height={20}
                      sx={{ mb: 0.5 }}
                    />
                    <Skeleton 
                      variant="text" 
                      width={`${30 + Math.random() * 20}%`} 
                      height={16}
                    />
                  </Box>
                  <Skeleton 
                    variant="rectangular" 
                    width={60} 
                    height={24} 
                    sx={{ 
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.success.main, 0.1)
                    }} 
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </Box>
    );
  }

  // Default loading state
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 3,
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <CircularProgress 
          size={60} 
          thickness={4}
          sx={{
            color: theme.palette.primary.main,
            mb: 3
          }}
        />
      </motion.div>
      
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 600,
          color: theme.palette.text.secondary,
          textAlign: 'center'
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingState;
