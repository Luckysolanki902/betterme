import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  InputLabel,
  Chip,
  Stack,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  BugReport,
  Lightbulb,
  Send,
  CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';

const severityOptions = [
  { value: 'low', label: 'Low', color: '#4CAF50' },
  { value: 'medium', label: 'Medium', color: '#FF9800' },
  { value: 'high', label: 'High', color: '#F44336' },
  { value: 'critical', label: 'Critical', color: '#9C27B0' },
];

const priorityOptions = [
  { value: 'low', label: 'Nice to have' },
  { value: 'medium', label: 'Important' },
  { value: 'high', label: 'Urgent' },
];

export default function BugReportPage() {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    type: 'bug',
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    severity: 'medium',
    priority: 'medium',
    browser: '',
    os: '',
    email: '',
    additionalInfo: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
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
          title: '',
          description: '',
          stepsToReproduce: '',
          expectedBehavior: '',
          actualBehavior: '',
          severity: 'medium',
          priority: 'medium',
          browser: '',
          os: '',
          email: '',
          additionalInfo: '',
        });
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (err) {
      setError('Failed to submit your report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Paper
              elevation={8}
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 4,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <CheckCircle
                sx={{
                  fontSize: 80,
                  color: theme.palette.success.main,
                  mb: 3,
                }}
              />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                Thank You!
              </Typography>
              <Typography variant="h6" sx={{ color: theme.palette.text.secondary, mb: 4 }}>
                Your {formData.type === 'bug' ? 'bug report' : 'feature request'} has been submitted successfully.
              </Typography>
              <Typography variant="body1" sx={{ mb: 4 }}>
                We appreciate your feedback and will review it as soon as possible. 
                If you provided an email, we'll keep you updated on the progress.
              </Typography>
              <Button
                variant="contained"
                onClick={() => setSubmitted(false)}
                sx={{ borderRadius: 3 }}
              >
                Submit Another Report
              </Button>
            </Paper>
          </motion.div>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                mb: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Help Us Improve
            </Typography>
            <Typography variant="h6" sx={{ color: theme.palette.text.secondary, maxWidth: '600px', mx: 'auto' }}>
              Found a bug or have an idea for a new feature? We'd love to hear from you!
            </Typography>
          </Box>
        </motion.div>

        <Paper
          elevation={12}
          component={motion.div}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          sx={{
            p: 4,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Type Selection */}
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
                    What would you like to report?
                  </FormLabel>
                  <RadioGroup
                    row
                    value={formData.type}
                    onChange={handleInputChange('type')}
                  >
                    <FormControlLabel
                      value="bug"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BugReport sx={{ color: theme.palette.error.main }} />
                          Bug Report
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="feature"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Lightbulb sx={{ color: theme.palette.warning.main }} />
                          Feature Request
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {/* Title */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={`${formData.type === 'bug' ? 'Bug' : 'Feature'} Title`}
                  value={formData.title}
                  onChange={handleInputChange('title')}
                  required
                  placeholder={formData.type === 'bug' ? 'Brief description of the bug' : 'Brief description of the feature'}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Detailed Description"
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  required
                  placeholder={
                    formData.type === 'bug'
                      ? 'Describe what happened and what went wrong...'
                      : 'Describe the feature you would like to see...'
                  }
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              {/* Bug-specific fields */}
              {formData.type === 'bug' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Steps to Reproduce"
                      value={formData.stepsToReproduce}
                      onChange={handleInputChange('stepsToReproduce')}
                      placeholder="1. Go to..."
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Expected Behavior"
                      value={formData.expectedBehavior}
                      onChange={handleInputChange('expectedBehavior')}
                      placeholder="What should have happened?"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Actual Behavior"
                      value={formData.actualBehavior}
                      onChange={handleInputChange('actualBehavior')}
                      placeholder="What actually happened?"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                </>
              )}

              {/* Severity/Priority */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={formData.severity}
                    onChange={handleInputChange('severity')}
                    label="Severity"
                    sx={{ borderRadius: 2 }}
                  >
                    {severityOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip
                            size="small"
                            label={option.label}
                            sx={{
                              backgroundColor: option.color,
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={handleInputChange('priority')}
                    label="Priority"
                    sx={{ borderRadius: 2 }}
                  >
                    {priorityOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Browser/OS Info */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Browser"
                  value={formData.browser}
                  onChange={handleInputChange('browser')}
                  placeholder="Chrome, Firefox, Safari, etc."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Operating System"
                  value={formData.os}
                  onChange={handleInputChange('os')}
                  placeholder="Windows, macOS, Linux, etc."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              {/* Email */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email (Optional)"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="We'll keep you updated on the progress"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              {/* Additional Info */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Additional Information"
                  value={formData.additionalInfo}
                  onChange={handleInputChange('additionalInfo')}
                  placeholder="Screenshots, error messages, or any other helpful details..."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              {error && (
                <Grid item xs={12}>
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {error}
                  </Alert>
                </Grid>
              )}

              {/* Submit Button */}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : <Send />}
                  sx={{
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    py: 1.5,
                    px: 4,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isSubmitting ? 'Submitting...' : `Submit ${formData.type === 'bug' ? 'Bug Report' : 'Feature Request'}`}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </Layout>
  );
}
