import React, { createContext, useContext, useEffect, useState } from 'react';

// Create the context
const StartDateContext = createContext();

// Create a provider component
export const StartDateProvider = ({ children }) => {
  const [startDate, setStartDate] = useState(null);

  useEffect(() => {
    const fetchStartDate = async () => {
      try {
        const res = await fetch('/api/configs');
        
        // Check if the response is OK
        if (res.ok) {
          const config = await res.json();
          // Extract the startDate from the config
          const date = config.startDate ? new Date(config.startDate) : null;
          setStartDate(date);
        } else {
          console.error("Failed to fetch config:", res.status);
        }
      } catch (error) {
        console.error("Error fetching config:", error);
      }
    };

    fetchStartDate();
  }, []);

  return (
    <StartDateContext.Provider value={startDate}>
      {children}
    </StartDateContext.Provider>
  );
};

// Custom hook to use the StartDateContext
export const useStartDate = () => {
  return useContext(StartDateContext);
};
