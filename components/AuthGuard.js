import { useState, useEffect } from 'react';
import { Box, CircularProgress, Container, Typography, Button, Paper, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import LockIcon from '@mui/icons-material/Lock';
import TypeAdminPassword from './TypeAdminPassword';
import { useRouter } from 'next/router';
import { useTheme } from '@mui/material/styles';

const AuthGuard = (WrappedComponent) => {
  const WithAuth = (props) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);
    const router = useRouter();
    const theme = useTheme();

    // Check authentication status on load
    useEffect(() => {
      const checkAuthentication = async () => {
        try {
          const token = localStorage.getItem('sessionId');
          
          if (!token) {
            setIsAuthenticated(false);
            setAuthChecking(false);
            return;
          }
          
          // Verify token with the server
          const res = await fetch('/api/security/verify-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
          
          const data = await res.json();
          setIsAuthenticated(data.success);
        } catch (error) {
          console.error('Auth check error:', error);
          setIsAuthenticated(false);
        } finally {
          setAuthChecking(false);
        }
      };
      
      checkAuthentication();
    }, []);

    // Loading state
    if (authChecking) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, rgba(66, 99, 235, 0.05) 0%, rgba(147, 112, 219, 0.05) 100%)',
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CircularProgress
              size={60}
              thickness={4}
              sx={{
                color: theme.palette.primary.main
              }}
            />
            <Typography
              variant="subtitle1"
              sx={{
                mt: 3,
                textAlign: 'center',
                fontWeight: 500,
                color: theme.palette.text.secondary
              }}
            >
              Verifying access...
            </Typography>
          </motion.div>
        </Box>
      );
    }

    // Not authenticated state
    if (!isAuthenticated) {
      return (
        <Container 
          maxWidth="md" 
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 5,
              borderRadius: 4,
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              width: '100%',
              maxWidth: 500,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
              textAlign: 'center'
            }}
          >
            <Box 
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                mx: 'auto',
                boxShadow: '0 8px 20px rgba(66, 99, 235, 0.3)'
              }}
            >
              <LockIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
              Protected Area
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
              Please verify your identity to access this content
            </Typography>
            
            <TypeAdminPassword onSuccess={() => setIsAuthenticated(true)} />
            
            <Box sx={{ mt: 4 }}>
              <Button 
                onClick={() => router.push('/')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  color: theme.palette.text.secondary
                }}
              >
                Return to Home
              </Button>
            </Box>
          </Paper>
        </Container>
      );
    }

    // Authenticated state - render the protected component
    return <WrappedComponent {...props} />;
  };

  return WithAuth;
};

export default AuthGuard;
