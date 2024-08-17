import React, { createContext, useContext } from 'react';

// Create the context
const StartDateContext = createContext();

// Create a provider component
export const StartDateProvider = ({ children }) => {
  const startDate = new Date('2024-08-12');

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
