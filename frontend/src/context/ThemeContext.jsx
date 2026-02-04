import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const THEME_STORAGE_KEY = 'iidx-tier-tracker-theme';

export const ThemeProvider = ({ children }) => {
  // Force dark mode
  const [theme] = useState('dark');

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('dark');
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
  }, []);

  const toggleTheme = () => {
    // No-op: Theme toggle disabled
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
