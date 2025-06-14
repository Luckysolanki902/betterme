// components/planner/PlannerLayout.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  IconButton, 
  Drawer, 
  useTheme, 
  alpha, 
  useMediaQuery,
  Divider 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import { motion, AnimatePresence } from 'framer-motion';
import PlannerSidebar from './PlannerSidebar';

const PlannerLayout = ({ children, currentPageId, title }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  
  useEffect(() => {
    // Close drawer on mobile when page changes
    if (isMobile) {
      setDrawerOpen(false);
    }
  }, [currentPageId, isMobile]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: 'calc(100vh - 100px)',
      position: 'relative',
    }}>
      {/* Sidebar for desktop */}
      {!isMobile && (
        <Box
          component={motion.div}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          sx={{
            width: '260px',
            flexShrink: 0,
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            height: 'calc(100vh - 100px)',
            position: 'sticky',
            top: '100px',
            overflowY: 'auto',
            p: 2,
            pr: 1,
            backgroundImage: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.8)}, ${theme.palette.background.paper})`,
            backdropFilter: 'blur(8px)',
            // Nice scrollbar
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: alpha(theme.palette.divider, 0.1),
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: alpha(theme.palette.divider, 0.3),
              borderRadius: '10px',
              '&:hover': {
                background: alpha(theme.palette.divider, 0.5),
              },
            },
          }}
        >
          <PlannerSidebar currentPageId={currentPageId} />
        </Box>
      )}

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            width: '85%', 
            maxWidth: '300px',
            boxSizing: 'border-box',
            borderRight: 'none',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
            background: theme.palette.background.paper,
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            mb: 2,
            pb: 1,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Pages
            </Typography>
            <IconButton onClick={handleDrawerToggle} edge="end">
              <KeyboardArrowLeftIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <PlannerSidebar currentPageId={currentPageId} />
          </Box>
        </Box>
      </Drawer>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { xs: '100%', md: 'calc(100% - 260px)' },
          ml: { xs: 0, md: 0 },
        }}
      >
        {/* Mobile header with menu button */}
        {isMobile && (
          <Paper 
            elevation={0}
            component={motion.div}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 2,
              p: 1.5,
              borderRadius: '12px',
              border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              background: alpha(theme.palette.background.paper, 0.7),
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                onClick={handleDrawerToggle} 
                sx={{ 
                  mr: 1,
                  background: alpha(theme.palette.primary.main, 0.08),
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.15),
                  }
                }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap sx={{ flex: 1, fontWeight: 600 }}>
                {title || 'Planner'}
              </Typography>
            </Box>
          </Paper>
        )}
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageId || 'planner-home'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default PlannerLayout;
