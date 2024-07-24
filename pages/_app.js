// pages/_app.js
import "@/styles/globals.css";
import { useEffect, useState } from 'react';
import PasswordPage from '@/components/TypeAdminPassword';
import { CircularProgress, Container } from '@mui/material';

export default function App({ Component, pageProps }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('sessionId');
      if (token) {
        try {
          const response = await fetch('/api/security/verify-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });
          const data = await response.json();
          if (data.success) {
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error("Error verifying token", error);
        }
      }
      setIsLoading(false);
    };
    
    verifyToken();
  }, []);

  if (isLoading) {
    return (
      <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return isAuthenticated ? <Component {...pageProps} /> : <PasswordPage />;
}
