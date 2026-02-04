import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Menu, X } from 'lucide-react';

const API_URL = 'http://localhost:5000';

export default function Header() {
  const { user, loading } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const renderAuthLinks = (mobile = false) => {
    if (loading) {
      return null;
    }

    const linkClass = mobile
      ? "block py-3 px-4 hover:bg-white/10 rounded-xl transition-colors"
      : "hover:text-blue-500 transition-colors";

    if (user) {
      return (
        <>
          <span className={`text-sm text-gray-600 dark:text-gray-400 ${mobile ? 'block py-3 px-4' : ''}`}>
            Welcome, {user.display_name}
          </span>
          <Link to="/stats" className={linkClass} onClick={mobile ? closeMobileMenu : undefined}>Stats</Link>
          {user.is_admin && (
            <Link to="/admin" className={`${linkClass} text-purple-600 dark:text-purple-400`} onClick={mobile ? closeMobileMenu : undefined}>Admin</Link>
          )}
          <a href={`${API_URL}/auth/logout`} className={`${linkClass} text-red-600 dark:text-red-400`}>Logout</a>
        </>
      );
    } else {
      return <Link to="/login" className={linkClass} onClick={mobile ? closeMobileMenu : undefined}>Login</Link>;
    }
  };

  return (
    <header className="sticky top-0 z-50 px-3 sm:px-6 py-2 sm:py-4">
      <nav className="glass mx-auto max-w-7xl rounded-xl sm:rounded-2xl px-4 sm:px-8 py-3 sm:py-6 transition-all duration-300">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center gap-6 lg:gap-10 flex-wrap">
          <Link to="/" className="font-heading font-bold text-lg hover:text-primary transition-all hover:scale-105">Home</Link>
          <Link to="/dashboard" className="font-medium hover:text-primary transition-all hover:scale-105">Dashboard</Link>
          {renderAuthLinks()}
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center justify-between">
          <Link to="/" className="font-heading font-bold text-lg" onClick={closeMobileMenu}>IIDX Tracker</Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 !bg-transparent !border-none !shadow-none"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-white/10 flex flex-col gap-1">
            <Link to="/" className="block py-3 px-4 hover:bg-white/10 rounded-xl transition-colors font-heading font-bold" onClick={closeMobileMenu}>Home</Link>
            <Link to="/dashboard" className="block py-3 px-4 hover:bg-white/10 rounded-xl transition-colors font-medium" onClick={closeMobileMenu}>Dashboard</Link>
            {renderAuthLinks(true)}
          </div>
        )}
      </nav>
    </header>
  );
}