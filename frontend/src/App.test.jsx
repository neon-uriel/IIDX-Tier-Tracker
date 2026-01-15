import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';

// Mock the pages to avoid testing their content here
vi.mock('./pages/HomePage', () => ({ default: () => <div>HomePage</div> }));
vi.mock('./pages/LoginPage', () => ({ default: () => <div>LoginPage</div> }));
vi.mock('./pages/DashboardPage', () => ({ default: () => <div>DashboardPage</div> }));


describe('App Routing', () => {


  it('renders HomePage for the root path', () => {


    render(


      <MemoryRouter initialEntries={['/']}>


        <AppRoutes />


      </MemoryRouter>


    );


    expect(screen.getByText('HomePage')).toBeInTheDocument();


  });





  it('renders LoginPage for the /login path', () => {


    render(


      <MemoryRouter initialEntries={['/login']}>


        <AppRoutes />


      </MemoryRouter>


    );


    expect(screen.getByText('LoginPage')).toBeInTheDocument();


  });





  it('renders DashboardPage for the /dashboard path', () => {


    render(


      <MemoryRouter initialEntries={['/dashboard']}>


        <AppRoutes />


      </MemoryRouter>


    );


    expect(screen.getByText('DashboardPage')).toBeInTheDocument();


  });


});

