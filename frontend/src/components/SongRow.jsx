import React, { memo } from 'react';
import LampSelector from './LampSelector';

const SongRow = memo(({ song, currentLamp, onLampUpdate }) => {
  // Format sub_level display
  const subLevelDisplay = song.sub_level ? song.sub_level : '-';

  return (
    <tr key={song.id}>
      <td className="font-bold" dangerouslySetInnerHTML={{ __html: song.title }}></td>
      <td>{song.artist}</td>
      <td>{song.genre}</td>
      <td>{song.difficulty}</td>
      <td>{song.level}</td>
      <td className={song.sub_level ? '' : 'text-gray-400'}>{subLevelDisplay}</td>
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