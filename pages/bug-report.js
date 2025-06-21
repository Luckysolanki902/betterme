import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  ButtonGroup,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Grow,
  Fade,
  Zoom,
} from '@mui/material';
import {
  BugReport,
  Lightbulb,
  Send,
  CheckCircle,
  Feedback,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';

export default function BugReportPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState({
    type: 'bug',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (event) => {
    setFormData({
      ...formData,
      description: event.target.value,
    });
  };

  const handleTypeChange = (type) => {
    setFormData({
      ...formData,
      type,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/bug-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          type: 'bug',
          description: '',
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  if (submitted) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 6, px: isMobile ? 2 : 3 }}>
          <Zoom in={true} timeout={800}>
            <Box
              elevation={6}
              sx={{
                p: isMobile ? 3 : 5,
                borderRadius: 4,
                textAlign: 'center',
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(145deg, #1E2025, #2E3035)'
                  : 'linear-gradient(145deg, #FFFFFF, #F8F9FA)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 12px 28px rgba(0,0,0,0.3)'
                  : '0 12px 28px rgba(0,0,0,0.12)',
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '6px',
                  background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.primary.main})`,
                }
              }}
            >
              <Grow in={true} timeout={1200}>
                <Box>
                  <Box 
                    sx={{ 
                      mb: 2,
                      display: 'inline-flex',
                      p: 2,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${theme.palette.success.light}, ${theme.palette.success.main})`,
                    }}
                  >
                    <CheckCircle
                      sx={{
                        fontSize: isMobile ? 60 : 80,
                        color: '#fff',
                      }}
                    />
                  </Box>
                  <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 800, mb: 2 }}>
                    Thank You!
                  </Typography>
                  <Typography variant={isMobile ? "body1" : "h6"} sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                    Your {formData.type === 'bug' ? 'report' : 'suggestion'} has been submitted successfully.
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 4 }}>
                    We appreciate your feedback and will review it as soon as possible.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setSubmitted(false)}
                    size={isMobile ? "medium" : "large"}
                    sx={{ 
                      borderRadius: 8, 
                      py: 1.5, 
                      px: 4,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 8px 20px rgba(0,0,0,0.3)'
                        : '0 8px 20px rgba(0,0,0,0.1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 12px 30px rgba(0,0,0,0.4)'
                          : '0 12px 30px rgba(0,0,0,0.15)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Submit Another
                  </Button>
                </Box>
              </Grow>
            </Box>
          </Zoom>
        </Container>
      </Layout>
    );
  }
  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 } }}>
        <Fade in={true} timeout={800}>
          <Box>
            <Box sx={{ 
              textAlign: 'center', 
              mb: 4,
              position: 'relative',
              zIndex: 1,
            }}>
              <Box 
                sx={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <Feedback 
                  sx={{ 
                    fontSize: 40, 
                    mr: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }} 
                />
              </Box>
              <Typography
                variant={isMobile ? "h5" : "h4"}
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '0.5px',
                  textShadow: theme.palette.mode === 'dark' ? '0 2px 4px rgba(0,0,0,0.5)' : 'none',
                }}
              >
                Share Your Thoughts
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                Found a bug or have a suggestion? Let us know!
              </Typography>
            </Box>
            
            <Box 
              elevation={6} 
              sx={{ 
                p: { xs: 3, md: 4 }, 
                borderRadius: 4,
                mb: 4,
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(145deg, #1E2025, #2E3035)'
                  : 'linear-gradient(145deg, #FFFFFF, #F8F9FA)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 12px 28px rgba(0,0,0,0.3)'
                  : '0 12px 28px rgba(0,0,0,0.12)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 2 }}
              >
                {error}
              </Alert>
            )}
          
            <form onSubmit={handleSubmit}>              {/* Report Type */}
              <Box 
                sx={{ 
                  mb: 4, 
                  display: 'flex', 
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <ButtonGroup 
                  variant="contained" 
                  size={isMobile ? "medium" : "large"}
                  sx={{ 
                    borderRadius: 8,
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 8px 16px rgba(0,0,0,0.3)'
                      : '0 8px 16px rgba(0,0,0,0.1)',
                  }}
                >
                  <Button 
                    onClick={() => handleTypeChange('bug')}
                    startIcon={<BugReport />}
                    sx={{ 
                      px: { xs: 2, sm: 3 },
                      py: 1.5,
                      backgroundColor: formData.type === 'bug' 
                        ? `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})` 
                        : 'action.disabledBackground',
                      color: formData.type === 'bug' ? 'primary.contrastText' : 'text.secondary',
                      '&:hover': {
                        backgroundColor: formData.type === 'bug' ? theme.palette.error.dark : 'action.hover'
                      },
                      borderRadius: '8px 0 0 8px',
                      transition: 'all 0.3s ease',
                      fontWeight: 600,
                    }}
                  >
                    Bug
                  </Button>
                  <Button 
                    onClick={() => handleTypeChange('feedback')}
                    startIcon={<Lightbulb />}
                    sx={{ 
                      px: { xs: 2, sm: 3 },
                      py: 1.5,
                      backgroundColor: formData.type === 'feedback' 
                        ? `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})` 
                        : 'action.disabledBackground',
                      color: formData.type === 'feedback' ? 'primary.contrastText' : 'text.secondary',
                      '&:hover': {
                        backgroundColor: formData.type === 'feedback' ? theme.palette.secondary.dark : 'action.hover'
                      },
                      borderRadius: '0 8px 8px 0',
                      transition: 'all 0.3s ease',
                      fontWeight: 600,
                    }}
                  >
                    Suggestion
                  </Button>
                </ButtonGroup>
              </Box>
                {/* Description */}
              <TextField
                fullWidth
                multiline
                rows={isMobile ? 8 : 10}
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder={
                  formData.type === 'bug'
                    ? 'Describe the issue you encountered in detail...\n\nWhat happened? When did it occur? Any steps to reproduce it?'
                    : 'Share your idea or suggestion...\n\nWhat would you like to see improved or added? How would it help you?'
                }
                variant="outlined"
                sx={{ 
                  mb: 4,
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 3,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: formData.type === 'bug' ? theme.palette.error.main : theme.palette.secondary.main,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: formData.type === 'bug' ? theme.palette.error.main : theme.palette.secondary.main,
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputBase-inputMultiline': {
                    fontSize: '1.1rem',
                    lineHeight: 1.6,
                  },
                  boxShadow: theme.palette.mode === 'dark' 
                    ? 'inset 0 2px 8px rgba(0,0,0,0.2)' 
                    : 'inset 0 2px 8px rgba(0,0,0,0.05)'
                }}
              />
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  size={isMobile ? "large" : "large"}
                  disabled={isSubmitting || !formData.description.trim()}
                  startIcon={isSubmitting ? 
                    <CircularProgress size={20} color="inherit" /> : 
                    <Send sx={{ animation: !isSubmitting && formData.description.trim() ? 'pulse 1.5s infinite' : 'none' }} />
                  }
                  sx={{
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    py: 1.8,
                    px: { xs: 3, sm: 5 },
                    minWidth: { xs: '60%', sm: '50%' },
                    background: formData.type === 'bug'
                      ? `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`
                      : `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 8px 20px rgba(0,0,0,0.3)'
                      : '0 8px 20px rgba(0,0,0,0.15)',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 12px 30px rgba(0,0,0,0.4)'
                        : '0 12px 30px rgba(0,0,0,0.2)',
                    },
                    '&:active': {
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.3s ease',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.1)' },
                      '100%': { transform: 'scale(1)' },
                    }
                  }}
                >
                  {isSubmitting ? 'Submitting...' : formData.type === 'bug' ? 'Submit Report' : 'Submit Suggestion'}
                </Button>
              </Box>
              
              <Typography 
                variant="caption" 
                align="center" 
                color="text.secondary"
                sx={{ 
                  display: 'block', 
                  mt: 3,
                  opacity: 0.8,
                  fontStyle: 'italic'
                }}
              >
                Your feedback helps us improve Better Me for everyone              </Typography>            </form>
          </Box>
        </Box>
      </Fade>
      </Container>
    </Layout>
  );
}
