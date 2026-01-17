import { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const API_URL = 'http://localhost:5000';

export default function Header() {
  const { user, loading } = useContext(AuthContext);

  const [darkMode, setDarkMode] = useState(() => {
    // Initialize dark mode from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  const renderAuthLinks = () => {
    if (loading) {
      return null; // Don't show anything while loading
    }

    if (user) {
      return (
        <>
          <span>Welcome, {user.display_name}</span> | <Link to="/stats">Stats</Link> | <a href={`${API_URL}/auth/logout`}>Logout</a>
        </>
      );
    } else {
      return <Link to="/login">Login</Link>;
    }
  };

  return (
    <header>
      <nav>
        <Link to="/">Home</Link> | <Link to="/dashboard">Dashboard</Link> | {renderAuthLinks()}
        <button onClick={toggleDarkMode}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </nav>
    </header>
  );
}