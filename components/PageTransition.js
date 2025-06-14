import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';

// Enhanced page variants for a more impressive transition
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

// Fancy overlay element (optional visual enhancement)
const overlayVariants = {
  initial: { scaleX: 1 },
  animate: { scaleX: 0, transition: { duration: 0.5, ease: [0.645, 0.045, 0.355, 1.0] } },
  exit: { scaleX: 1, transition: { duration: 0.5, ease: [0.645, 0.045, 0.355, 1.0] } }
};

const PageTransition = ({ children }) => {
  const router = useRouter();
  
  // Optional: scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [router.pathname]);
  
  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', width: '100%' }}>
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
      
      {/* Optional: fancy overlay animation that slides across during transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`overlay-${router.pathname}`}
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
            background: 'linear-gradient(135deg, rgba(66, 99, 235, 0.2) 0%, rgba(147, 112, 219, 0.2) 100%)',
            transformOrigin: 'left',
            zIndex: 9999,
            pointerEvents: 'none',
            backdropFilter: 'blur(8px)',
          }}
        />
      </AnimatePresence>
    </Box>
  );
};

export default PageTransition;
