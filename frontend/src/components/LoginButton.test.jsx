import { render, screen } from '@testing-library/react';
import LoginButton from './LoginButton';

describe('LoginButton', () => {
  it('renders a link to the backend google auth route', () => {
    render(<LoginButton />);
    const link = screen.getByRole('link', { name: /Login with Google/i });
    expect(link).toBeInTheDocument();
    // The link should point to the backend, not a frontend route
    expect(link).toHaveAttribute('href', 'http://localhost:5000/auth/google');
  });
});
