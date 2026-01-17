import { render, screen } from '@testing-library/react';
import ContributionCalendarComponent from './ContributionCalendar';
import { ContributionCalendar } from 'react-contribution-calendar'; // Import the mocked component

// Explicitly mock the problematic CSS import
vi.mock('react-contribution-calendar/dist/styles/index.css', () => ({ default: {} }));

describe('ContributionCalendarComponent', () => {
  it('renders without crashing', () => {
    render(<ContributionCalendarComponent history={[]} />);
    expect(screen.getByText(/No lamp history available./i)).toBeInTheDocument();
  });

  it('displays "No lamp history available." when history is empty', () => {
    render(<ContributionCalendarComponent history={[]} />);
    expect(screen.getByText(/No lamp history available./i)).toBeInTheDocument();
  });

  it('displays "No lamp history available." when history is undefined', () => {
    render(<ContributionCalendarComponent history={undefined} />);
    expect(screen.getByText(/No lamp history available./i)).toBeInTheDocument();
  });

  it('renders the ContributionCalendar and title when history data is provided', () => {
    const mockHistory = [
      { created_at: '2026-01-01T10:00:00Z' },
      { created_at: '2026-01-01T11:00:00Z' },
      { created_at: '2026-01-02T12:00:00Z' },
    ];
    render(<ContributionCalendarComponent history={mockHistory} />);

    expect(screen.getByText(/Lamp Update History/i)).toBeInTheDocument();
    expect(screen.getByText(/Mock Contribution Calendar/i)).toBeInTheDocument();
    expect(ContributionCalendar).toHaveBeenCalledTimes(1);
    expect(ContributionCalendar).toHaveBeenCalledWith(
      expect.objectContaining({
        dateOptions: expect.any(Object),
        data: expect.any(Array),
      }),
      {}
    );
  });
});