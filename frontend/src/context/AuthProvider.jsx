import { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

// Set a base URL for axios
const API_URL = 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${API_URL}/current_user`, {
            // This is crucial for sending cookies in cross-origin requests
            withCredentials: true,
        });
        if (response.data) {
          setUser(response.data);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const value = { user, setUser, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
