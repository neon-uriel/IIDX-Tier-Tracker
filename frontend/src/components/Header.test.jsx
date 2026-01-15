import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Header from './Header';

const renderWithContext = (ui, { providerProps, ...renderOptions }) => {
  return render(
    <AuthContext.Provider {...providerProps}>
        <MemoryRouter>
            {ui}
        </MemoryRouter>
    </AuthContext.Provider>,
    renderOptions
  );
};

describe('Header', () => {
    it('shows login link when user is not authenticated', () => {
        const providerProps = {
            value: { user: null, loading: false }
        };
        renderWithContext(<Header />, { providerProps });

        expect(screen.getByRole('link', { name: /Login/i })).toBeInTheDocument();
        expect(screen.queryByText(/Logout/i)).not.toBeInTheDocument();
    });

    it('shows user display name and logout link when user is authenticated', () => {
        const testUser = { display_name: 'Test User' };
        const providerProps = {
            value: { user: testUser, loading: false }
        };
        renderWithContext(<Header />, { providerProps });
        
        expect(screen.getByText(`Welcome, ${testUser.display_name}`)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Logout/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Logout/i })).toHaveAttribute('href', 'http://localhost:5000/auth/logout');
        expect(screen.queryByRole('link', { name: /Login/i })).not.toBeInTheDocument();
    });

    it('shows nothing related to user when loading', () => {
        const providerProps = {
            value: { user: null, loading: true }
        };
        renderWithContext(<Header />, { providerProps });

        expect(screen.queryByText(/Welcome/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /Login/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /Logout/i })).not.toBeInTheDocument();
    });
});
