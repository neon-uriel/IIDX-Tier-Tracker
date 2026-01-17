import React from 'react';
import { render, screen, waitFor } from '@testing-library/react'; // Corrected import syntax
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import DashboardPage from './DashboardPage';

vi.mock('axios'); // Mock axios for API calls

describe('DashboardPage', () => {
  const mockSongsLevel12 = [
    { id: 1, title: 'Song A', artist: 'Artist 1', genre: 'Genre 1', difficulty: 'SPA', level: 12, version: 28 },
    { id: 2, title: 'Song B', artist: 'Artist 2', genre: 'Genre 2', difficulty: 'SPH', level: 12, version: 28 },
    { id: 4, title: 'Filtered Song D', artist: 'Artist 4', genre: 'Genre 4', difficulty: 'SPH', level: 12, version: 28 }, // Added for filter test
  ];

  const mockSongsLevel10 = [
    { id: 3, title: 'Song C', artist: 'Artist 3', genre: 'Genre 3', difficulty: 'SPA', level: 10, version: 28 },
    { id: 4, title: 'Filtered Song D', artist: 'Artist 4', genre: 'Genre 4', difficulty: 'SPH', level: 10, version: 28 },
  ];

  const mockUserLamps = [
    { id: 101, userId: 1, songId: 1, lamp: 'HARD' },
  ];

  beforeEach(() => {
    // Default mocks for successful fetches
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/songs')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const level = urlParams.get('level');
        const songName = urlParams.get('songName');

        let filteredSongs = [];
        if (level === '10') {
          filteredSongs = mockSongsLevel10;
        } else { // Default or level 12
          filteredSongs = mockSongsLevel12;
        }

        if (songName) {
          filteredSongs = filteredSongs.filter(song =>
            song.title.toLowerCase().includes(songName.toLowerCase())
          );
        }
        return Promise.resolve({ data: filteredSongs });
      }
      if (url.includes('/api/lamps')) {
        return Promise.resolve({ data: mockUserLamps });
      }
      return Promise.reject(new Error('Unknown GET URL'));
    });
    axios.put.mockResolvedValue({ data: {} }); // Mock for LampSelector updates
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders DashboardPage with level selector and song name filter', async () => {
    render(<DashboardPage />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Level:')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by Song Name:')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Songs (Level ☆12, SP)')).toBeInTheDocument();
    });
    expect(screen.getByText('Song A')).toBeInTheDocument();
  });

  it('fetches and displays user lamps correctly', async () => {
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/lamps');
    });

    const lampSelectorForSong1 = await screen.findByDisplayValue('HARD');
    expect(lampSelectorForSong1).toBeInTheDocument();
  });

  it('updates song lamp when LampSelector is used', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Song A')).toBeInTheDocument();
    });

    const lampSelectorForSong1 = screen.getByDisplayValue('HARD');
    const newLamp = 'EX-HARD';

    await user.selectOptions(lampSelectorForSong1, newLamp);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith('/api/lamps', { songId: 1, lamp: newLamp });
    });
    expect(lampSelectorForSong1).toHaveValue(newLamp);
  });

  it('displays loading message while fetching songs', () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/songs')) {
        return new Promise(() => {}); // Pending promise for songs
      }
      if (url.includes('/api/lamps')) {
        return Promise.resolve({ data: mockUserLamps });
      }
      return Promise.reject(new Error('Unknown GET URL'));
    });
    render(<DashboardPage />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('displays error message if fetching songs fails', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/songs')) {
        return Promise.reject(new Error('Network Error'));
      }
      if (url.includes('/api/lamps')) {
        return Promise.resolve({ data: mockUserLamps });
      }
      return Promise.reject(new Error('Unknown GET URL'));
    });
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch songs. Please try again.')).toBeInTheDocument();
    });
  });

  it('fetches and displays songs for a selected level', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/songs?level=12&playMode=SP&songName=');
    });

    const levelSelector = screen.getByLabelText('Select Level:');
    await user.selectOptions(levelSelector, '10');

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/songs?level=10&playMode=SP&songName=');
    });

          expect(screen.getByText('Songs (Level ☆10, SP)')).toBeInTheDocument();    expect(screen.getByText('Song C')).toBeInTheDocument();
    expect(screen.queryByText('Song A')).not.toBeInTheDocument(); // Old songs should not be there
  });

  it('filters songs by song name', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/songs?level=12&playMode=SP&songName=');
    });

    const songNameFilterInput = screen.getByLabelText('Filter by Song Name:');
    await user.type(songNameFilterInput, 'Filtered');

    await waitFor(() => {
      // Expect axios.get to be called with the correct songName filter
      expect(axios.get).toHaveBeenCalledWith('/api/songs?level=12&playMode=SP&songName=Filtered');
    });

    // Expect only the filtered song to be displayed
    expect(screen.getByText('Filtered Song D')).toBeInTheDocument();
    expect(screen.queryByText('Song A')).not.toBeInTheDocument();
  });

  it('displays "No songs found" message if no songs are returned for a level', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/songs')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/api/lamps')) {
        return Promise.resolve({ data: mockUserLamps });
      }
      return Promise.reject(new Error('Unknown GET URL'));
    });
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('No songs found for Level ☆12, SP.')).toBeInTheDocument();
    });
  });
});
