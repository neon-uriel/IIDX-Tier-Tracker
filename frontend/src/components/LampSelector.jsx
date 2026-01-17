import React, { useState, memo } from 'react';
import axios from 'axios';

const LampSelector = memo(({ songId, currentLamp, onLampUpdate }) => {
  const [selectedLamp, setSelectedLamp] = useState(currentLamp);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const lampOptions = [
    'NO PLAY', 'FAILED', 'ASSIST CLEAR', 'EASY CLEAR', 'CLEAR', 'HARD', 'EX-HARD', 'FULLCOMBO'
  ];

  const handleLampChange = async (event) => {
    const newLamp = event.target.value;
    setSelectedLamp(newLamp);
    setIsUpdating(true);
    setError(null);

    try {
      await axios.put('/api/lamps', { songId, lamp: newLamp });
      if (onLampUpdate) {
        onLampUpdate(songId, newLamp);
      }
    } catch (err) {
      console.error('Error updating lamp:', err);
      setError('Failed to update lamp.');
      setSelectedLamp(currentLamp); // Revert on error
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="lamp-selector-container">
      <select value={selectedLamp} onChange={handleLampChange} disabled={isUpdating}>
        {lampOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="updating-status" style={{ visibility: isUpdating ? 'visible' : 'hidden', minWidth: '80px' }}>
        Updating...
      </span>
      {error && <span className="error-message">{error}</span>} {/* Added conditional rendering for error */}
    </div>
  );
});

export default LampSelector;