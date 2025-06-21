import React, { useState } from 'react';
import {
  Typography,
  Box,
  Container,
  TextField,
  Button,
  Paper,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Snackbar,
  useTheme,
  alpha
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import SendIcon from '@mui/icons-material/Send';
import Layout from '@/components/Layout';

const BugReportSimple = () => {
  const theme = useTheme();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'bug',
    email: ''
  });
  
  const [submitStatus, setSubmitStatus] = useState({
    loading: false,
    success: false,
    error: null
  });
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title.trim() || !formData.description.trim()) {
      setSubmitStatus({
        loading: false,
        success: false,
        error: 'Please provide a title and description.'
      });
      setSnackbarOpen(true);
      return;
    }
    
    setSubmitStatus({ loading: true, success: false, error: null });
    
    try {
      const res = await fetch('/api/bug-report-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSubmitStatus({
          loading: false,
          success: true,
          error: null
        });
        
        // Reset form on successful submission
        setFormData({
          title: '',
          description: '',
          type: 'bug',
          email: ''
        });
      } else {
        throw new Error(data.error || 'Failed to submit your report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitStatus({
        loading: false,
        success: false,
        error: error.message || 'An unexpected error occurred'
      });
    }
    
    setSnackbarOpen(true);
  };
  
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  return (
    <Layout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: 3, 
            p: { xs: 3, md: 5 },
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            background: `linear-gradient(to bottom right, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.98)})`
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 3, 
            pb: 2, 
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`
          }}>
            <BugReportIcon 
              sx={{ 
                fontSize: 32, 
                color: theme.palette.primary.main, 
                mr: 2 
              }} 
            />
            <Typography 
              variant="h4" 
              component="h1" 
              fontWeight="700"
              sx={{
                background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Report an Issue
            </Typography>
          </Box>
          
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
            Help us improve by reporting any issues you've encountered or sharing your suggestions.
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 4 }}>
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <FormLabel component="legend" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
                  What would you like to report?
                </FormLabel>
                <RadioGroup
                  row
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <FormControlLabel 
                    value="bug" 
                    control={<Radio />} 
                    label="Bug/Issue" 
                  />
                  <FormControlLabel 
                    value="feedback" 
                    control={<Radio />} 
                    label="Feedback/Suggestion" 
                  />
                </RadioGroup>
              </FormControl>
              
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                margin="normal"
                required
                variant="outlined"
                placeholder={formData.type === 'bug' ? 'Brief description of the issue' : 'Name of your suggestion'}
                sx={{ mb: 3 }}
              />
              
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                margin="normal"
                required
                multiline
                rows={5}
                variant="outlined"
                placeholder={formData.type === 'bug' 
                  ? 'Please describe what happened and what you expected to happen' 
                  : 'Please describe your suggestion in detail'
                }
                sx={{ mb: 3 }}
              />
              
              <TextField
                fullWidth
                label="Email (Optional)"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                placeholder="If you'd like us to follow up with you"
                helperText="We'll only use this to follow up on your report if needed"
                sx={{ mb: 3 }}
              />
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SendIcon />}
                disabled={submitStatus.loading}
                sx={{ 
                  py: 1.5,
                  px: 4,
                  background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #3b5bde 0%, #8663c9 100%)',
                  }
                }}
              >
                {submitStatus.loading ? 'Submitting...' : 'Submit Report'}
              </Button>
            </Box>
          </form>
        </Paper>
        
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={submitStatus.success ? "success" : "error"}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {submitStatus.success 
              ? "Thank you! Your report has been submitted successfully." 
              : submitStatus.error || "An error occurred. Please try again."}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
};

export default BugReportSimple;
