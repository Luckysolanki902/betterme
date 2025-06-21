import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { Box, Typography, useTheme } from '@mui/material';

// Page content variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
  }
};

// Sequential animate-in for child elements
const staggerChildrenVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 }
};

// Full-screen transition overlay variants
const overlayVariants = {
  initial: { 
    scaleY: 0, 
    y: '-100%' 
  },
  animate: { 
    scaleY: 1,
    y: '0%',
    transition: { 
      duration: 0.7, 
      ease: [0.645, 0.045, 0.355, 1.0],
    }
  },
  exit: { 
    y: '100%', 
    transition: { 
      duration: 0.7, 
      ease: [0.645, 0.045, 0.355, 1.0],
      delay: 0.2
    } 
  }
};

// Transition text variants
const textVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      delay: 0.3
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.4,
      ease: "easeIn"
    }
  }
};

const PageTransition = ({ children }) => {
  const router = useRouter();
  const theme = useTheme();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationPath, setNavigationPath] = useState('');
  
  // Handle route change events
  useEffect(() => {
    const handleRouteChangeStart = (url) => {
      setIsNavigating(true);
      // Extract path name from URL
      const pathSegments = url.split('/').filter(Boolean);
      const pageName = pathSegments.length > 0 
        ? pathSegments[pathSegments.length - 1].charAt(0).toUpperCase() + pathSegments[pathSegments.length - 1].slice(1)
        : 'Home';
      
      setNavigationPath(pageName);
    };
    
    const handleRouteChangeComplete = () => {
      // Let the animation play out before setting navigating to false
      setTimeout(() => {
        setIsNavigating(false);
        window.scrollTo(0, 0);
      }, 1000);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router]);
  
  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', width: '100%' }}>
      {/* Main page content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={router.pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={{ 
            duration: 0.4, 
            ease: [0.22, 1, 0.36, 1]
          }}
          style={{ 
            width: '100%',
            willChange: 'transform, opacity'
          }}
        >
          {/* This wraps all children in a stagger animation context */}
          <motion.div
            variants={staggerChildrenVariants}
            initial="initial"
            animate="animate"
            transition={{
              staggerChildren: 0.05,
              delayChildren: 0.1,
            }}
            style={{ width: '100%' }}
          >
            {children}
          </motion.div>
        </motion.div>
      </AnimatePresence>
      
      {/* Full-screen navigation transition overlay */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={overlayVariants}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              transformOrigin: 'center',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {/* Animated navigation text */}
            <motion.div
              variants={textVariants}
              style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <Typography 
                variant="h2" 
                sx={{ 
                  color: 'white',
                  fontWeight: 800,
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                  textShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  mb: 2
                }}
              >
                {navigationPath}
              </Typography>
              
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '80px', transition: { delay: 0.5, duration: 0.6 } }}
                style={{
                  height: '4px',
                  background: 'white',
                  borderRadius: '2px',
                  marginBottom: '20px'
                }}
              />              
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  fontSize: { xs: '0.75rem', sm: '0.9rem' },
                  fontWeight: 500
                }}
              >
                Loading...
              </Typography>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default PageTransition;
