import React, { useState, memo, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const LampSelector = memo(({ songId, currentLamp, onLampUpdate }) => {
  const { user } = useContext(AuthContext);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const lampOptions = [
    'NO PLAY', 'FAILED', 'ASSIST CLEAR', 'EASY CLEAR', 'CLEAR', 'HARD', 'EX-HARD', 'FULLCOMBO'
  ];

  // Get CSS class for lamp glow effect
  const getLampClass = (lamp) => {
    const classMap = {
      'NO PLAY': 'lamp-no-play',
      'FAILED': 'lamp-failed',
      'ASSIST CLEAR': 'lamp-assist',
      'EASY CLEAR': 'lamp-easy',
      'CLEAR': 'lamp-clear',
      'HARD': 'lamp-hard',
      'EX-HARD': 'lamp-exhard',
      'FULLCOMBO': 'lamp-fullcombo',
    };
    return classMap[lamp] || 'lamp-no-play';
  };

  const handleLampChange = async (event) => {
    const newLamp = event.target.value;
    const oldLamp = currentLamp;

    // 1. Optimistic Update: Update the UI immediately
    if (onLampUpdate) {
      onLampUpdate(songId, newLamp);
    }

    setIsUpdating(true);
    setError(null);

    try {
      // 2. Background API call
      await axios.put('/api/lamps', { songId, lamp: newLamp });
    } catch (err) {
      console.error('Error updating lamp:', err);
      setError('Failed to update.');
      // 3. Rollback on error
      if (onLampUpdate) {
        onLampUpdate(songId, oldLamp);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Short display names for mobile
  const shortLampNames = {
    'NO PLAY': 'NO PLAY',
    'FAILED': 'FAILED',
    'ASSIST CLEAR': 'ASSIST',
    'EASY CLEAR': 'EASY',
    'CLEAR': 'CLEAR',
    'HARD': 'HARD',
    'EX-HARD': 'EX-HARD',
    'FULLCOMBO': 'FC'
  };

  return (
    <div className="lamp-selector-container flex items-center gap-1 sm:gap-2">
      <select
        value={currentLamp}
        onChange={handleLampChange}
        onClick={(e) => e.stopPropagation()}
        disabled={!user}
        className={`appearance-none bg-transparent border-none text-center font-bold outline-none cursor-pointer relative z-10 w-full h-full text-[10px] sm:text-sm ${getLampClass(currentLamp)}`}
        style={{ textShadow: '0 0 5px currentColor' }}
      >
        {lampOptions.map((option) => (
          <option key={option} value={option}>
            {shortLampNames[option] || option}
          </option>
        ))}
      </select>
      {isUpdating && (
        <span className="text-[8px] sm:text-xs text-gray-400 animate-pulse">...</span>
      )}
      {error && <span className="text-[8px] sm:text-xs text-red-500">!</span>}
    </div>
  );
});

export default LampSelector;