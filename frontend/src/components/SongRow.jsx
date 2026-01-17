import React, { memo } from 'react';
import LampSelector from './LampSelector';

const SongRow = memo(({ song, currentLamp, onLampUpdate }) => {
  return (
    <tr key={song.id}>
      <td>{song.title}</td>
      <td>{song.artist}</td>
      <td>{song.genre}</td>
      <td>{song.difficulty}</td>
      <td>{song.level}</td>
      <td>
        <LampSelector
          songId={song.id}
          currentLamp={currentLamp}
          onLampUpdate={onLampUpdate}
        />
      </td>
    </tr>
  );
});

export default SongRow;