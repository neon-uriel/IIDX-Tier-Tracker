import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { AuthProvider } from './context/AuthProvider'; // Import AuthProvider
import axios from 'axios'; // Import axios

// Mock axios globally for frontend tests
vi.mock('axios');

// Mock the pages to avoid testing their content here
vi.mock('./pages/HomePage', () => ({ default: () => <div>HomePage</div> }));
vi.mock('./pages/LoginPage', () => ({ default: () => <div>LoginPage</div> }));
vi.mock('./pages/DashboardPage', () => ({ default: () => <div>DashboardPage</div> }));

describe('App Routing', () => {
  beforeEach(() => {
    // Mock axios.get for any calls made by AuthProvider or other components
    axios.get.mockResolvedValue({ data: { user: null, isAuthenticated: false } });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders HomePage for the root path', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider> {/* Wrap AppRoutes with AuthProvider */}
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    );
    await screen.findByText('HomePage'); // Use findByText for async rendering
    expect(screen.getByText('HomePage')).toBeInTheDocument();
  });

  it('renders LoginPage for the /login path', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider> {/* Wrap AppRoutes with AuthProvider */}
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    );
    await screen.findByText('LoginPage'); // Use findByText for async rendering
    expect(screen.getByText('LoginPage')).toBeInTheDocument();
  });

  it('renders DashboardPage for the /dashboard path', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider> {/* Wrap AppRoutes with AuthProvider */}
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    );
    await screen.findByText('DashboardPage'); // Use findByText for async rendering
    expect(screen.getByText('DashboardPage')).toBeInTheDocument();
  });
});