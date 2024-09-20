import React, { createContext, useContext, useEffect, useState } from 'react';

// Create the context
const StartDateContext = createContext();

// Create a provider component
export const StartDateProvider = ({ children }) => {
  const [startDate, setStartDate] = useState(null);

  useEffect(() => {
    const fetchStartDate = async () => {
      const res = await fetch('/api/levels');
      const levels = await res.json();
      const lastLevel = levels.length ? levels[levels.length - 1] : null;
      const date = lastLevel ? new Date(lastLevel.startDate) : new Date(); // Fallback to now if no levels
      setStartDate(date);
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
