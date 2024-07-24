import TypeAdminPassword from "@/components/TypeAdminPassword";
import "@/styles/globals.css";
import React, { useEffect, useState } from 'react';



export default function App({ Component, pageProps }) {
  const [loading, setIsLoading] = useState(true);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = localStorage.getItem('adminAuthToken');

        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/admin/security/authenticate', {
          method: 'GET',
          headers: {
            'Authorization': token,
          },
        });

        const data = await response.json();

        if (data.success) {
          setIsAdminLoggedIn(true);
        } else {
          // Handle invalid or expired token
          console.error('Invalid token or insufficient privileges.');
          localStorage.removeItem('adminAuthToken');
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        // Handle token verification error
        localStorage.removeItem('adminAuthToken');
      } finally {
        setIsLoading(false); // Hide loading indicator when verification is complete
      }
    };
    verifyToken();
  }, []);


  const handleLogin = () => {
    setIsAdminLoggedIn(true);
  };
  return (
    <>
      {loading ? (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
          <p style={{ color: 'white' }}>Loading...</p>
        </div>
      ) : isAdminLoggedIn ? (
        <Component {...pageProps} />
      ) : (
        <TypeAdminPassword onLogin={handleLogin} />
      )}
    </>
  );
}
