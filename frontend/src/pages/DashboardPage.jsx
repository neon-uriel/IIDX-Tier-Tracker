import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LampSelector from '../components/LampSelector'; // Import LampSelector

export default function DashboardPage() {
  const [selectedLevel, setSelectedLevel] = useState(12); // Default to level 12
  const [songNameFilter, setSongNameFilter] = useState(''); // New state for song name filter
  const [songs, setSongs] = useState([]);
  const [userLamps, setUserLamps] = useState({}); // Store user lamps keyed by songId
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [loadingLamps, setLoadingLamps] = useState(false);
  const [error, setError] = useState(null);

  // Fetch songs based on selected level and song name filter
  useEffect(() => {
    const fetchSongs = async () => {
      setLoadingSongs(true);
      setError(null);
      try {
        const response = await axios.get(`/api/songs?level=${selectedLevel}&songName=${songNameFilter}`);
        setSongs(response.data);
      } catch (err) {
        console.error('Error fetching songs:', err);
        setError('Failed to fetch songs. Please try again.');
      } finally {
        setLoadingSongs(false);
      }
    };

    fetchSongs();
  }, [selectedLevel, songNameFilter]); // Re-fetch when level or filter changes

  // Fetch user lamps
  useEffect(() => {
    const fetchUserLamps = async () => {
      setLoadingLamps(true);
      try {
        const response = await axios.get('/api/lamps');
        const lampsMap = response.data.reduce((acc, lamp) => {
          acc[lamp.songId] = lamp.lamp;
          return acc;
        }, {});
        setUserLamps(lampsMap);
      } catch (err) {
        console.error('Error fetching user lamps:', err);
        // Do not set global error, as songs might still load
      } finally {
        setLoadingLamps(false);
      }
    };

    fetchUserLamps();
  }, []); // Fetch only once on component mount

  const handleLevelChange = (event) => {
    setSelectedLevel(parseInt(event.target.value));
  };

  const handleSongNameFilterChange = (event) => {
    setSongNameFilter(event.target.value);
  };

  const handleLampUpdate = (songId, newLamp) => {
    setUserLamps(prevLamps => ({
      ...prevLamps,
      [songId]: newLamp,
    }));
  };

  const isLoading = loadingSongs || loadingLamps;

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>
      <div className="controls">
        <div className="level-selector">
          <label htmlFor="level-select">Select Level: </label>
          <select id="level-select" value={selectedLevel} onChange={handleLevelChange}>
            {[...Array(12).keys()].map(i => (
              <option key={i + 1} value={i + 1}>
                ☆{i + 1}
              </option>
            ))}
          </select>
        </div>
        <div className="song-name-filter">
          <label htmlFor="song-name-filter">Filter by Song Name: </label>
          <input
            id="song-name-filter"
            type="text"
            value={songNameFilter}
            onChange={handleSongNameFilterChange}
            placeholder="Enter song name"
          />
        </div>
      </div>

      {isLoading && <p>Loading data...</p>}
      {error && <p className="error-message">{error}</p>}

      {!isLoading && !error && songs.length > 0 && (
        <div className="songs-table">
          <h2>Songs (Level ☆{selectedLevel})</h2>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Artist</th>
                <th>Genre</th>
                <th>Difficulty</th>
                <th>Level</th>
                <th>Lamp</th>
              </tr>
            </thead>
            <tbody>
              {songs.map((song) => (
                <tr key={song.id}>
                  <td>{song.title}</td>
                  <td>{song.artist}</td>
                  <td>{song.genre}</td>
                  <td>{song.difficulty}</td>
                  <td>{song.level}</td>
                  <td>
                    <LampSelector
                      songId={song.id}
                      currentLamp={userLamps[song.id] || 'NO PLAY'}
                      onLampUpdate={handleLampUpdate}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !error && songs.length === 0 && (
        <p>No songs found for Level ☆{selectedLevel}.</p>
      )}
    </div>
  );
}