import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { TextField, Button, IconButton, InputAdornment } from '@mui/material';
import styles from '@/components/styles/admin.module.css'
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

const TypeAdminPassword = ({ onLogin }) => {
    const [password1, setPassword1] = useState('');
    const [password2, setPassword2] = useState('');
    const [showPassword1, setShowPassword1] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const router = useRouter();

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch('/api/security/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password1, password2 }),
            });

            const data = await response.json();
            if (data.success) {
                const { token } = data;
                console.log(token)
                localStorage.setItem('adminAuthToken', token);
                console.log('Logged in successfully');
                onLogin(); // Invoke the login function passed as a prop
            } else {
                setErrorMessage(data.message || 'Error granting admin access.');
            }
        } catch (error) {
            console.error('Error validating password:', error);
        }
    };
    const toggleShowPassword = (field) => {
        if (field === 'password1') {
            setShowPassword1(!showPassword1);
        } else {
            setShowPassword2(!showPassword2);
        }
    };
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />

            <div style={{ padding: '2rem', width: '100%', height: 'auto', overflow:'auto' }}>
                <div className={styles.maddyCustom} style={{ margin: '0' }}>BetterMe</div>
                <div className={styles.adminPanel} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: 'auto', marginTop: '3rem', marginBottom: '4rem' }}>
                    <h1 className={styles.heading}>Greetings, Admin</h1>
                    <p className={styles.description}>Begin managing stickers seamlessly!</p>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: '4rem', width: '30%', minWidth: '215px', }}>
                        <TextField
                            label="Password 1"
                            type={showPassword1 ? 'text' : 'password'}
                            value={password1}
                            onChange={(e) => setPassword1(e.target.value)}
                            fullWidth
                            margin="normal"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => toggleShowPassword('password1')} edge="end">
                                            {showPassword1 ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="Password 2"
                            type={showPassword2 ? 'text' : 'password'}
                            value={password2}
                            onChange={(e) => setPassword2(e.target.value)}
                            fullWidth
                            margin="normal"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => toggleShowPassword('password2')} edge="end">
                                            {showPassword2 ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        {errorMessage && <p>{errorMessage}</p>}
                        <Button variant="contained" color="primary" type="submit" sx={{ marginTop: '2rem', width: '90%', backgroundColor: 'white', color: 'black' }}>
                            Submit
                        </Button>
                    </form>
                </div>
                <style>
                    {`
              html, body {
                background-color: #1a1a1a;
                color: #f0f0f0;
                font-family: Jost, sans-serif;
                margin: 0;
                height: 100%;
              }
              `}
                </style>
            </div>
        </ThemeProvider>
    );
};

export default TypeAdminPassword;
