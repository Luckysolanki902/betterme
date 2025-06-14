// components/TypeAdminPassword.js
import React, { useState } from 'react';
import { 
    TextField, 
    Button, 
    IconButton, 
    InputAdornment, 
    Typography, 
    Snackbar, 
    CircularProgress, 
    Box,
    Paper,
    alpha,
    useTheme
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import MuiAlert from '@mui/material/Alert';
import { motion } from 'framer-motion';

const TypeAdminPassword = ({ onSuccess }) => {
    const { handleSubmit, control, setError, formState: { errors } } = useForm();
    const [showPassword, setShowPassword] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const theme = useTheme();

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    const onSubmit = async (data) => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/security/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: data.password }),
            });
            const result = await response.json();

            if (result.success) {
                localStorage.setItem('sessionId', result.token);
                setSnackbarMessage('Login successful!');
                setOpenSnackbar(true);
                // Notify parent component of successful login
                if (onSuccess && typeof onSuccess === 'function') {
                    onSuccess();
                }
            } else {
                setError('password', { type: 'manual', message: 'Incorrect password!' });
            }
        } catch (error) {
            console.error('Authentication error:', error);
            setSnackbarMessage('Failed to authenticate. Please try again.');
            setOpenSnackbar(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box 
            component={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            sx={{ 
                width: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center'
            }}
        >
            <Box 
                component={motion.div}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                sx={{
                    width: 70,
                    height: 70,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha('#9370DB', 0.1)} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
            >
                <LockOutlined 
                    sx={{ 
                        fontSize: 32, 
                        color: theme.palette.primary.main
                    }} 
                />
            </Box>
            
            <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <Controller
                        name="password"
                        control={control}
                        defaultValue=""
                        rules={{ required: 'Password is required' }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                type={showPassword ? 'text' : 'password'}
                                label="Password"
                                variant="outlined"
                                fullWidth
                                error={!!errors.password}
                                helperText={errors.password ? errors.password.message : ''}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={handleClickShowPassword}
                                                onMouseDown={handleMouseDownPassword}
                                                edge="end"
                                            >
                                                {showPassword ? <Visibility /> : <VisibilityOff />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ 
                                    mb: 3,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                            />
                        )}
                    />
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                >
                    <Button
                        variant="contained"
                        type="submit"
                        fullWidth
                        disabled={isLoading}
                        sx={{
                            py: 1.5,
                            background: 'linear-gradient(135deg, #4263EB, #9370DB)',
                            borderRadius: 2,
                            fontWeight: 600,
                            boxShadow: '0 4px 10px rgba(66, 99, 235, 0.25)',
                            textTransform: 'none',
                            fontSize: '1rem',
                            '&:hover': {
                                boxShadow: '0 6px 15px rgba(66, 99, 235, 0.35)',
                                transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Unlock Access'}
                    </Button>
                </motion.div>
            </form>

            <Snackbar 
                open={openSnackbar} 
                autoHideDuration={3000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <MuiAlert 
                    onClose={handleCloseSnackbar} 
                    severity={errors.password ? 'error' : 'success'}
                    elevation={6}
                    variant="filled"
                    sx={{ width: '100%', borderRadius: 2 }}
                >
                    {errors.password ? errors.password.message : snackbarMessage}
                </MuiAlert>
            </Snackbar>
        </Box>
    );
};

export default TypeAdminPassword;
