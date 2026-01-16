import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import LampSelector from './LampSelector';

vi.mock('axios'); // Mock axios for API calls

describe('LampSelector', () => {
  const songId = 1;
  const currentLamp = 'NO PLAY';
  const onLampUpdate = vi.fn();

  beforeEach(() => {
    axios.put.mockResolvedValue({ data: {} }); // Default mock for successful update
    vi.clearAllMocks();
  });

  it('renders with the current lamp selected', () => {
    render(<LampSelector songId={songId} currentLamp={currentLamp} onLampUpdate={onLampUpdate} />);
    expect(screen.getByRole('combobox')).toHaveValue(currentLamp);
  });

  it('calls axios.put and onLampUpdate when lamp is changed', async () => {
    const user = userEvent.setup();
    render(<LampSelector songId={songId} currentLamp={currentLamp} onLampUpdate={onLampUpdate} />);

    const newLamp = 'EASY CLEAR';
    await user.selectOptions(screen.getByRole('combobox'), newLamp);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith('/api/lamps', { songId, lamp: newLamp });
    });
    await waitFor(() => {
      expect(onLampUpdate).toHaveBeenCalledWith(songId, newLamp);
    });
    expect(screen.getByRole('combobox')).toHaveValue(newLamp);
  });

  it('displays updating status while saving', async () => {
    axios.put.mockReturnValueOnce(new Promise(() => {})); // Mock an永遠にpending promise
    const user = userEvent.setup();
    render(<LampSelector songId={songId} currentLamp={currentLamp} onLampUpdate={onLampUpdate} />);

    const newLamp = 'HARD'; // Corrected from 'HARD CLEAR'
    await user.selectOptions(screen.getByRole('combobox'), newLamp);

    expect(screen.getByText('Updating...')).toBeInTheDocument();
  });

  it('displays error message and reverts selection if update fails', async () => {
    axios.put.mockRejectedValueOnce(new Error('API Error'));
    const user = userEvent.setup();
    render(<LampSelector songId={songId} currentLamp={currentLamp} onLampUpdate={onLampUpdate} />);

    const newLamp = 'FAILED';
    await user.selectOptions(screen.getByRole('combobox'), newLamp);

    await waitFor(() => {
      expect(screen.getByText('Failed to update lamp.')).toBeInTheDocument(); // Expect the error message to be displayed
    });
    expect(screen.getByRole('combobox')).toHaveValue(currentLamp); // Reverts to original lamp
    expect(onLampUpdate).not.toHaveBeenCalled();
  });
});