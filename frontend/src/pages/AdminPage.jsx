import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  rectIntersection,
} from '@dnd-kit/core';
import AdminSongList from '../components/admin/AdminSongList';
import AdminDragDrop from '../components/admin/AdminDragDrop';

export default function AdminPage() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [selectedLevel, setSelectedLevel] = useState(12);
  const [selectedPlayMode, setSelectedPlayMode] = useState('SP');
  const [selectedClassification, setSelectedClassification] = useState('AC'); // Added classification state
  const [viewMode, setViewMode] = useState('dnd'); // 'list' or 'dnd'
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [customSubLevels, setCustomSubLevels] = useState([]); // Added to hold manually created sub_levels
  const [searchQuery, setSearchQuery] = useState(''); // Added search state

  // Reset custom sub levels and search when level changes
  useEffect(() => {
    setCustomSubLevels([]);
    setSearchQuery('');
  }, [selectedLevel]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoid accidental drags
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Fetch songs
  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `/api/songs?level=${selectedLevel}&playMode=${selectedPlayMode}&classification=${selectedClassification}`
        );
        // Sort by Title for default consistency, or SubLevel?
        // Let's sort by Title initially, components will do their own sorting.
        const fetchedSongs = response.data || [];
        fetchedSongs.sort((a, b) => a.title.localeCompare(b.title));
        setSongs(fetchedSongs);
      } catch (err) {
        console.error('Error fetching songs:', err);
        setError('楽曲の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [selectedLevel, selectedPlayMode, selectedClassification]);

  // Filter songs based on search query
  const filteredSongs = React.useMemo(() => {
    if (!searchQuery) return songs;
    const q = searchQuery.toLowerCase();
    return songs.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q)
    );
  }, [songs, searchQuery]);

  // Save sub_level to backend
  const saveSubLevel = async (songId, subLevel) => {
    setSaveStatus((prev) => ({ ...prev, [songId]: 'saving' }));
    try {
      await axios.put(`/api/songs/${songId}/sub_level`, {
        sub_level: subLevel,
      }, {
        withCredentials: true,
      });
      setSaveStatus((prev) => ({ ...prev, [songId]: 'saved' }));
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [songId]: null }));
      }, 2000);
    } catch (err) {
      console.error('Error saving sub_level:', err);
      setSaveStatus((prev) => ({ ...prev, [songId]: 'error' }));
    }
  };

  // Save classification to backend
  const saveClassification = async (songId, classification) => {
    setSaveStatus((prev) => ({ ...prev, [songId]: 'saving' }));
    try {
      await axios.put(`/api/songs/${songId}/classification`, {
        classification: classification,
      }, {
        withCredentials: true,
      });
      setSaveStatus((prev) => ({ ...prev, [songId]: 'saved' }));
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [songId]: null }));
      }, 2000);
    } catch (err) {
      console.error('Error saving classification:', err);
      setSaveStatus((prev) => ({ ...prev, [songId]: 'error' }));
    }
  };

  // DnD Handlers
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Check if dropped on a folder
    // Folder IDs are now "folder-地力 S+", "folder-個人差 A", etc.
    if (String(over.id).startsWith('folder-')) {
      const folderLabel = String(over.id).substring(7); // Remove "folder-" prefix
      const songId = active.id;

      if (folderLabel === 'unassigned') {
        const newSubLevel = null;
        setSongs(prev => prev.map(s =>
          s.id === songId ? { ...s, sub_level: newSubLevel } : s
        ));
        saveSubLevel(songId, newSubLevel);
        return;
      }

      // Calculate new SubLevel value: "Level.Label" (e.g., "12.地力 S+")
      const newSubLevel = `${selectedLevel}.${folderLabel}`;

      // Update local state
      setSongs(prev => prev.map(s =>
        s.id === songId ? { ...s, sub_level: newSubLevel } : s
      ));

      // Save
      saveSubLevel(songId, newSubLevel);
    }
  }, [selectedLevel]);

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Manual Change Handler (List View)
  const handleManualSubLevelChange = (songId, subLevelLabel) => {
    // subLevelLabel is either null or a label like "地力 S+"
    const newSubLevel = subLevelLabel === null ? null : `${selectedLevel}.${subLevelLabel}`;
    setSongs(prev => prev.map(s =>
      s.id === songId ? { ...s, sub_level: newSubLevel } : s
    ));
    saveSubLevel(songId, newSubLevel);
  };

  const handleClassificationChange = (songId, classification) => {
    setSongs(prev => prev.map(s =>
      s.id === songId ? { ...s, classification: classification } : s
    ));
    saveClassification(songId, classification);
  };

  // Check admin access
  if (authLoading) {
    return <div className="p-4 text-white">Loading...</div>;
  }

  if (!user?.is_admin) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2 text-white">Only administrators can access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
          Tier Management
        </h1>

        <div className="w-full sm:w-auto flex flex-wrap gap-2 sm:gap-4 items-center bg-black/30 p-2 rounded-xl border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm font-bold text-gray-400">LV</span>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
              className="bg-black/50 border border-white/20 rounded-lg px-2 sm:px-3 py-1 text-primary font-bold focus:outline-none focus:border-primary text-sm"
            >
              {[...Array(12).keys()].map((i) => (
                <option key={i + 1} value={i + 1}>☆{i + 1}</option>
              ))}
            </select>
          </div>

          <div className="hidden sm:block w-px h-6 bg-white/10"></div>

          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm font-bold text-gray-400">MODE</span>
            <select
              value={selectedPlayMode}
              onChange={(e) => setSelectedPlayMode(e.target.value)}
              className="bg-black/50 border border-white/20 rounded-lg px-2 sm:px-3 py-1 text-primary font-bold focus:outline-none focus:border-primary text-sm"
            >
              <option value="SP">SP</option>
              <option value="DP">DP</option>
            </select>
          </div>

          <div className="hidden sm:block w-px h-6 bg-white/10"></div>

          {/* AC/CS Toggle */}
          <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setSelectedClassification('AC')}
              className={`px-2 sm:px-4 py-1 rounded-md text-xs sm:text-sm font-bold transition-all ${selectedClassification === 'AC' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              AC
            </button>
            <button
              onClick={() => setSelectedClassification('CS')}
              className={`px-2 sm:px-4 py-1 rounded-md text-xs sm:text-sm font-bold transition-all ${selectedClassification === 'CS' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              CS
            </button>
          </div>
        </div>

        <div className="hidden sm:block w-px h-6 bg-white/10"></div>

        <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
          <button
            onClick={() => setViewMode('dnd')}
            className={`px-2 sm:px-4 py-1 rounded-md text-xs sm:text-sm font-bold transition-all ${viewMode === 'dnd' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <span className="sm:hidden">D&D</span>
            <span className="hidden sm:inline">Drag & Drop</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-2 sm:px-4 py-1 rounded-md text-xs sm:text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <span className="sm:hidden">List</span>
            <span className="hidden sm:inline">List View</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-primary animate-pulse mt-20">Loading songs...</div>
      ) : (
        viewMode === 'dnd' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <AdminDragDrop
              songs={filteredSongs}
              activeId={activeId}
              customSubLevels={customSubLevels}
              onAddCustomSubLevel={(label) => setCustomSubLevels(prev => [...new Set([...prev, label])])}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </DndContext>
        ) : (
          <AdminSongList
            songs={filteredSongs}
            onSubLevelChange={handleManualSubLevelChange}
            onClassificationChange={handleClassificationChange}
            saveStatus={saveStatus}
            customSubLevels={customSubLevels}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )
      )}
    </div>
  );
}
