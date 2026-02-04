import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import axios from 'axios';
import { Virtuoso } from 'react-virtuoso';
import LampSelector from '../components/LampSelector';
import SongRow from '../components/SongRow';
import { AuthContext } from '../context/AuthContext';

export default function DashboardPage() {
  const [selectedLevel, setSelectedLevel] = useState(10);
  const [selectedPlayMode, setSelectedPlayMode] = useState('SP');
  const [songNameFilter, setSongNameFilter] = useState('');
  const [songs, setSongs] = useState([]);
  const [userLamps, setUserLamps] = useState({});
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [loadingLamps, setLoadingLamps] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'level', direction: 'ascending' });
  const [selectedSubLevel, setSelectedSubLevel] = useState(''); // Added subLevel state
  const [availableSubLevels, setAvailableSubLevels] = useState([]); // To keep track of all available sub-levels for current level/mode
  const { user, loading: authLoading } = useContext(AuthContext);

  // Lamp priority map for sorting
  const lampPriority = {
    'NO PLAY': 0,
    'FAILED': 1,
    'ASSIST CLEAR': 2,
    'EASY CLEAR': 3,
    'CLEAR': 4,
    'HARD': 5,
    'EX-HARD': 6,
    'FULLCOMBO': 7
  };

  // Fetch songs based on selected level, play mode, and song name filter
  useEffect(() => {
    const fetchSongs = async () => {
      setLoadingSongs(true);
      setError(null);
      try {
        const apiUrl = `/api/songs?level=${selectedLevel}&playMode=${selectedPlayMode}&songName=${songNameFilter}&classification=AC${selectedSubLevel ? `&subLevel=${selectedSubLevel}` : ''}`;

        const response = await axios.get(apiUrl);

        const fetchedSongs = Array.isArray(response.data) ? response.data : [];
        setSongs(fetchedSongs);

        // Update available sub-levels only when we are NOT filtering by sub-level
        // to ensure the list doesn't shrink to only the selected one.
        if (!selectedSubLevel) {
          const subLevels = new Set();
          fetchedSongs.forEach(song => {
            if (song.sub_level !== null) subLevels.add(song.sub_level);
            else subLevels.add('null');
          });

          // Custom sort: Rank (S+, S, A+, A...) first, then type (地力, 個人差)
          const sorted = Array.from(subLevels).sort((a, b) => {
            // null always at the end
            if (a === 'null') return 1;
            if (b === 'null') return -1;

            // Extract rank and type from sub_level (e.g., "12.地力 S+" -> rank: "S+", type: "地力")
            const parseSubLevel = (sl) => {
              const match = sl.match(/^(\d+)\.(地力|個人差|未定)\s*([A-Z+\-]*)/);
              if (!match) return { level: 0, type: '', rank: '' };
              return {
                level: parseInt(match[1]),
                type: match[2],
                rank: match[3] || '未定'
              };
            };

            const aParsed = parseSubLevel(a);
            const bParsed = parseSubLevel(b);

            // Sort by rank first (S+ > S > A+ > A > B+ > B > C > D > E > F > 未定)
            const rankOrder = { 'S+': 0, 'S': 1, 'A+': 2, 'A': 3, 'B+': 4, 'B': 5, 'C+': 6, 'C': 7, 'D+': 8, 'D': 9, 'E': 10, 'F': 11, '未定': 12 };
            const aRankOrder = rankOrder[aParsed.rank] ?? 99;
            const bRankOrder = rankOrder[bParsed.rank] ?? 99;

            if (aRankOrder !== bRankOrder) {
              return aRankOrder - bRankOrder;
            }

            // If same rank, sort by type (地力 before 個人差)
            const typeOrder = { '地力': 0, '個人差': 1, '未定': 2 };
            const aTypeOrder = typeOrder[aParsed.type] ?? 99;
            const bTypeOrder = typeOrder[bParsed.type] ?? 99;

            return aTypeOrder - bTypeOrder;
          });

          setAvailableSubLevels(sorted);
        }
      } catch (err) {
        console.error('Error fetching songs:', err);
        setError('Failed to fetch songs. Please try again.');
        setSongs([]);
      } finally {
        setLoadingSongs(false);
      }
    };

    fetchSongs();
  }, [selectedLevel, selectedPlayMode, songNameFilter, selectedSubLevel]); // Re-fetch when level, play mode, filter, or subLevel changes

  // Fetch user lamps
  useEffect(() => {


    const fetchUserLamps = async () => {

      setLoadingLamps(true);
      try {
        const response = await axios.get('/api/lamps');
        // Ensure response.data is an array before processing
        if (Array.isArray(response.data)) {
          const lampsMap = response.data.reduce((acc, lamp) => {
            acc[lamp.song_id] = lamp.lamp;
            return acc;
          }, {});
          setUserLamps(lampsMap);
        } else {
          console.warn('API returned non-array for user lamps:', response.data);
          setUserLamps({});
        }
      } catch (err) {
        console.error('Error fetching user lamps:', err);
        // Do not set global error, as songs might still load
        setUserLamps({});
      } finally {
        setLoadingLamps(false);
      }
    };

    if (user && !authLoading) { // Only fetch if user is authenticated and auth is not loading

      fetchUserLamps();
    } else if (!user && !authLoading) { // If not authenticated and auth loading is done, clear lamps

      setUserLamps({});
    }
  }, [user, authLoading]); // Re-fetch when user or authLoading changes

  const handleLevelChange = (event) => {
    const newLevel = parseInt(event.target.value);
    setSelectedLevel(newLevel);
    setSelectedSubLevel(''); // Reset subLevel when level changes
    setSortConfig({ key: 'level', direction: 'ascending' }); // Reset sort to level ascending
  };


  const handlePlayModeChange = (event) => {
    setSelectedPlayMode(event.target.value);
    setSelectedSubLevel(''); // Reset subLevel when mode changes
  };

  const handleSubLevelChange = (event) => {
    setSelectedSubLevel(event.target.value);
  };

  const handleSongNameFilterChange = (event) => {
    setSongNameFilter(event.target.value);
  };

  const handleLampUpdate = useCallback((songId, newLamp) => {
    setUserLamps(prevLamps => ({
      ...prevLamps,
      [songId]: newLamp,
    }));
  }, [setUserLamps]);

  // Request sort
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Get sort indicator
  const getSortIndicator = (name) => {
    if (sortConfig.key === name) {
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    }
    return '';
  };

  // Sort songs
  const sortedSongs = useMemo(() => {
    if (!Array.isArray(songs)) return [];

    let sortableSongs = [...songs];
    if (sortConfig.key !== null) {
      sortableSongs.sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === 'lamp') {
          aValue = lampPriority[userLamps[a.id] || 'NO PLAY'];
          bValue = lampPriority[userLamps[b.id] || 'NO PLAY'];
        } else if (sortConfig.key === 'title') {
          // Strip HTML tags for sorting
          const stripTags = (str) => str ? str.replace(/<[^>]*>?/gm, '') : '';
          // Normalize to handle full-width/half-width (NFKC converts full-width alpha/num to half-width)
          aValue = stripTags(a[sortConfig.key]).toLowerCase().normalize('NFKC');
          bValue = stripTags(b[sortConfig.key]).toLowerCase().normalize('NFKC');
        } else if (sortConfig.key === 'level') {
          // Merge Level & Sub Level sorting
          // Unassigned (sub_level is null) should always be at the bottom
          const getVal = (item) => {
            if (item.sub_level === null) {
              return sortConfig.direction === 'ascending' ? Infinity : -Infinity;
            }

            // For numeric sub_levels like "10.1", parseFloat works fine
            const sub = item.sub_level;
            if (/^[0-9]+\.[0-9]+$/.test(sub)) {
              return parseFloat(sub);
            }

            // Parse sub_level format: "12.地力 S+" or "12.個人差 A"
            const match = sub.match(/^(\d+)\.(地力|個人差|未定)\s*([A-Z+\-]*)/);
            if (!match) {
              // Fallback for unexpected format
              return parseFloat(sub) || 0;
            }

            const baseLevel = parseInt(match[1], 10); // e.g., 12
            const type = match[2]; // "地力" or "個人差" or "未定"
            const rank = match[3] || '未定'; // "S+", "S", "A+", etc.

            // Rank priority (lower number = higher priority)
            const rankOrder = {
              'S+': 0, 'S': 1, 'A+': 2, 'A': 3, 'B+': 4, 'B': 5,
              'C+': 6, 'C': 7, 'D+': 8, 'D': 9, 'E': 10, 'F': 11, '未定': 12
            };

            // Type priority (地力 before 個人差)
            const typeOrder = { '地力': 0, '個人差': 1, '未定': 2 };

            const rankValue = rankOrder[rank] ?? 99;
            const typeValue = typeOrder[type] ?? 99;

            // Combine: baseLevel.rankValue.typeValue
            // e.g., 12.地力 S+ -> 12.00.0 = 12.000
            //       12.個人差 S+ -> 12.00.1 = 12.001
            //       12.地力 S -> 12.01.0 = 12.010
            return baseLevel + (rankValue / 100) + (typeValue / 10000);
          };
          aValue = getVal(a);
          bValue = getVal(b);
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableSongs;
  }, [songs, sortConfig, userLamps]);

  const isLoading = loadingSongs || loadingLamps || authLoading;

  return (
    <div className="dashboard-page p-3 sm:p-6 w-full mx-auto flex flex-col h-[calc(100vh-100px)] sm:h-[calc(100vh-120px)]">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 shrink-0">Dashboard</h1>
      <div className="controls glass-card !py-4 sm:!py-10 px-4 sm:px-8 mb-4 sm:mb-12 relative z-50 shrink-0">
        {/* Mobile: Grid layout, Desktop: Flex wrap */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-10 items-center justify-center">
          <div className="level-selector flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3">
            <label htmlFor="level-select" className="font-heading font-semibold text-primary text-sm sm:text-base">Level</label>
            <select
              id="level-select"
              value={selectedLevel}
              onChange={handleLevelChange}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-xl bg-white/10 dark:bg-black/20 border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer font-medium text-sm sm:text-base"
            >
              {[...Array(12).keys()].map(i => (
                <option key={i + 1} value={i + 1} className="bg-background dark:bg-black">
                  ☆{i + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="play-mode-selector flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3">
            <label htmlFor="play-mode-select" className="font-heading font-semibold text-primary text-sm sm:text-base">Mode</label>
            <select
              id="play-mode-select"
              value={selectedPlayMode}
              onChange={handlePlayModeChange}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-xl bg-white/10 dark:bg-black/20 border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer font-medium text-sm sm:text-base"
            >
              <option value="SP" className="bg-background dark:bg-black">SP</option>
              <option value="DP" className="bg-background dark:bg-black">DP</option>
            </select>
          </div>
          <div className="sub-level-selector flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3">
            <label htmlFor="sub-level-select" className="font-heading font-semibold text-primary text-sm sm:text-base">Sub Level</label>
            <select
              id="sub-level-select"
              value={selectedSubLevel}
              onChange={handleSubLevelChange}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-xl bg-white/10 dark:bg-black/20 border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer font-medium text-sm sm:text-base"
            >
              <option value="" className="bg-background dark:bg-black">All</option>
              {availableSubLevels.map(sl => (
                <option key={sl} value={sl} className="bg-background dark:bg-black">
                  {sl === 'null' ? '-' : sl.replace(/^\d+\./, '')}
                </option>
              ))}
            </select>
          </div>
          <div className="song-name-filter flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3">
            <label htmlFor="song-name-filter" className="font-heading font-semibold text-primary text-sm sm:text-base">Search</label>
            <input
              id="song-name-filter"
              type="text"
              value={songNameFilter}
              onChange={handleSongNameFilterChange}
              placeholder="Search..."
              className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-xl bg-white/10 dark:bg-black/20 border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium placeholder:text-foreground/30 text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      {isLoading && <p>Loading data...</p>}
      {error && <p className="error-message">{error}</p>}

      {!isLoading && !error && Array.isArray(sortedSongs) && sortedSongs.length > 0 && (
        <div className="songs-table-container w-full flex flex-col flex-1 min-h-0 glass-table rounded-xl overflow-hidden border border-white/20 shadow-2xl">
          {/* Virtualized Table Header */}
          <div className="table-header flex items-center bg-primary/20 font-heading font-bold text-primary border-b border-white/10 text-xs sm:text-base">
            <div className="p-2 sm:p-4 flex-1 cursor-pointer hover:bg-white/10 transition-colors border-r border-white/10" onClick={() => requestSort('title')}>Title {getSortIndicator('title')}</div>
            <div className="hidden md:block p-4 w-64 text-center cursor-pointer hover:bg-white/10 transition-colors border-r border-white/10" onClick={() => requestSort('artist')}>Artist {getSortIndicator('artist')}</div>
            <div className="hidden lg:block p-4 w-48 text-center cursor-pointer hover:bg-white/10 transition-colors border-r border-white/10" onClick={() => requestSort('genre')}>Genre {getSortIndicator('genre')}</div>
            <div className="p-2 sm:p-4 w-20 sm:w-28 text-center cursor-pointer hover:bg-white/10 transition-colors border-r border-white/10" onClick={() => requestSort('level')}><span className="sm:hidden">Lv</span><span className="hidden sm:inline">Level</span> {getSortIndicator('level')}</div>
            <div className="p-2 sm:p-4 w-28 sm:w-32 text-center cursor-pointer hover:bg-white/10 transition-colors" onClick={() => requestSort('lamp')}>Lamp {getSortIndicator('lamp')}</div>
          </div>

          {/* Virtualized List using react-virtuoso with hidden scrollbar */}
          <div className="flex-1 w-full scrollbar-hidden" style={{ height: '100%', minHeight: '100%' }}>
            <Virtuoso
              style={{ height: '100%' }}
              className="scrollbar-hidden"
              data={sortedSongs}
              context={{ userLamps, handleLampUpdate }}
              scrollerRef={(ref) => {
                if (ref) {
                  // Detect scrollbar width and set CSS variable
                  const scrollbarWidth = ref.offsetWidth - ref.clientWidth;
                  document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
                }
              }}
              itemContent={(index, song, { userLamps, handleLampUpdate }) => {
                const lamp = userLamps[song.id] || 'NO PLAY';
                const isEven = index % 2 === 0;

                // IIDX Difficulty Colors
                const getDifficultyStyle = (diff) => {
                  if (!diff) return '';
                  const d = diff.toUpperCase();
                  // Leggendaria (Purple)
                  if (d.includes('L')) return 'text-[#bf00ff] drop-shadow-[0_0_8px_rgba(191,0,255,0.6)] font-bold';
                  // Another (Red)
                  if (d.includes('A')) return 'text-[#ff3838] drop-shadow-[0_0_8px_rgba(255,56,56,0.6)] font-bold';
                  // Hyper (Yellow)
                  if (d.includes('H')) return 'text-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.6)] font-bold';
                  // Normal (Blue)
                  if (d.includes('N')) return 'text-[#00aaff] drop-shadow-[0_0_8px_rgba(0,170,255,0.6)] font-bold';
                  // Beginner (Green)
                  return 'text-[#00ff2e] drop-shadow-[0_0_8px_rgba(0,255,46,0.6)] font-bold';
                };

                const getLevelDisplay = (song) => {
                  if (!song.sub_level) return song.level;

                  // Extract the part after the level number (e.g., "12.地力 S+" -> "地力 S+")
                  const labelPart = song.sub_level.replace(/^\d+\./, '');

                  // If the label is purely numeric (e.g., "0", "1"), display as ★10.0
                  if (/^\d+(\.\d+)?$/.test(labelPart)) {
                    return `★${song.level}.${labelPart}`;
                  }

                  // Otherwise, display the label part only (e.g., "地力 S+")
                  return labelPart;
                };

                return (
                  <div className={`flex items-center border-b border-white/5 hover:bg-white/10 transition-colors ${!isEven ? 'bg-white/5' : ''}`}>
                    <div className="p-2 sm:p-4 flex-1 truncate font-bold text-xs sm:text-base border-r border-white/5" title={song.title} dangerouslySetInnerHTML={{ __html: song.title }}></div>
                    <div className="hidden md:block p-2 w-64 text-center truncate text-sm border-r border-white/5" title={song.artist}>{song.artist}</div>
                    <div className="hidden lg:block p-2 w-48 text-center truncate text-sm border-r border-white/5" title={song.genre}>{song.genre}</div>
                    <div className={`p-2 w-20 sm:w-28 text-center font-heading text-sm sm:text-lg whitespace-nowrap border-r border-white/5 ${getDifficultyStyle(song.difficulty)}`}>{getLevelDisplay(song)}</div>
                    <div className="p-1 sm:p-2 w-28 sm:w-32 flex justify-center">
                      <LampSelector
                        songId={song.id}
                        currentLamp={lamp}
                        onLampUpdate={handleLampUpdate}
                      />
                    </div>
                  </div>
                );
              }}
            />

          </div>
        </div>
      )}

      {!isLoading && !error && (!Array.isArray(sortedSongs) || sortedSongs.length === 0) && (
        <p className="text-center py-20 text-foreground/40 font-heading text-xl">
          No songs found for Level ☆{selectedLevel}, {selectedPlayMode}.
        </p>
      )}
    </div>
  );
}
