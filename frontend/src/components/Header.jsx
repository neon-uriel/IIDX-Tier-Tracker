import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const API_URL = 'http://localhost:5000';

export default function Header() {
  const { user, loading } = useContext(AuthContext);

  const renderAuthLinks = () => {
    if (loading) {
      return null; // Don't show anything while loading
    }

    if (user) {
      return (
        <>
          <span>Welcome, {user.display_name}</span> | <a href={`${API_URL}/auth/logout`}>Logout</a>
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
      </nav>
    </header>
  );
}
