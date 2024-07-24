// pages/PasswordPage.js
import React, { useState } from 'react';
import { TextField, Button, IconButton, InputAdornment, Typography, Snackbar, CircularProgress } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import MuiAlert from '@mui/material/Alert';

const PasswordPage = () => {
    const { handleSubmit, control, setError, formState: { errors } } = useForm();
    const [showPassword, setShowPassword] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);


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
            setIsLoading(true)
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
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                setError('password', { type: 'manual', message: 'Incorrect password!' });
            }
        } catch (error) {
            console.log(error)
        } finally {
            setIsLoading(false)
        }

    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20vh', padding: '20px' }}>
            <Typography variant="h4" gutterBottom>BetterMe</Typography>
            <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%', maxWidth: '400px' }}>
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
                                        >
                                            {showPassword ? <Visibility /> : <VisibilityOff />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            style={{ marginTop: '20px' }}
                        />
                    )}
                />
                <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    fullWidth
                    style={{ marginTop: '20px' }}
                >
                    {isLoading ? <CircularProgress sx={{ color: 'white' }} size={24} /> : 'Verify'}
                </Button>
            </form>
            <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={handleCloseSnackbar}>
                <MuiAlert onClose={handleCloseSnackbar} severity={errors.password ? 'error' : 'success'}>
                    {errors.password ? errors.password.message : snackbarMessage}
                </MuiAlert>
            </Snackbar>
        </div>
    );
};

export default PasswordPage;
