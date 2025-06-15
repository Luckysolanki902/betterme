// components/TodosLoading.js
import React from 'react';
import { 
  Box, 
  Skeleton, 
  Paper, 
  useTheme, 
  alpha 
} from '@mui/material';
import { motion } from 'framer-motion';

const TodosLoading = () => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
        position: 'relative',
        background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.9)}, ${theme.palette.background.paper})`,
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Header skeleton */}
      <Box 
        sx={{ 
          p: { xs: 1.5, sm: 2.5 }, 
          background: `linear-gradient(120deg, ${alpha(theme.palette.primary.light, 0.08)} 0%, ${alpha(theme.palette.secondary.light, 0.08)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Skeleton 
            variant="rounded" 
            height={48}
            sx={{ 
              borderRadius: 3,
              background: alpha(theme.palette.background.default, 0.3)
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Skeleton 
            variant="rounded" 
            width={80} 
            height={36}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton 
            variant="circular" 
            width={50} 
            height={50}
          />
        </Box>
      </Box>

      {/* Categories skeleton */}
      <Box sx={{ p: { xs: 1.5, sm: 2.5 }, pt: { xs: 1, sm: 1.5 } }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map((item) => (
            <Skeleton 
              key={item}
              variant="rounded" 
              width={item === 1 ? 60 : item === 2 ? 80 : item === 3 ? 70 : 90}
              height={32}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Box>

        {/* Todo items skeleton */}
        <Box sx={{ mt: 2 }}>
          {[1, 2, 3, 4, 5].map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  py: 1.5,
                  px: 1,
                  borderRadius: 2,
                  background: alpha(theme.palette.background.default, 0.3),
                  mb: 1,
                }}
              >
                <Skeleton 
                  variant="circular" 
                  width={24} 
                  height={24}
                />
                <Box sx={{ flex: 1 }}>
                  <Skeleton 
                    variant="text" 
                    width={`${Math.random() * 40 + 40}%`}
                    height={20}
                    sx={{ mb: 0.5 }}
                  />
                  <Skeleton 
                    variant="text" 
                    width={`${Math.random() * 30 + 20}%`}
                    height={16}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Skeleton 
                    variant="rounded" 
                    width={40} 
                    height={20}
                    sx={{ borderRadius: 1 }}
                  />
                  <Skeleton 
                    variant="rounded" 
                    width={50} 
                    height={20}
                    sx={{ borderRadius: 1 }}
                  />
                </Box>
              </Box>
            </motion.div>
          ))}
        </Box>
      </Box>

      {/* Floating shimmer effect */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
          animation: 'shimmer 2s infinite',
          '@keyframes shimmer': {
            '0%': { left: '-100%' },
            '100%': { left: '100%' }
          }
        }}
      />
    </Paper>
  );
};

export default TodosLoading;
