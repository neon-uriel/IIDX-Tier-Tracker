import React, { useState, useEffect } from 'react';
import { useDraggable, useDroppable, DndContext, DragOverlay } from '@dnd-kit/core';
import { Virtuoso } from 'react-virtuoso';

// Draggable Song Item
const DraggableSong = ({ song }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: song.id,
        data: { song },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`p-3 border-b border-white/5 hover:bg-white/10 cursor-grab active:cursor-grabbing flex justify-between items-center group overflow-hidden ${isDragging ? 'opacity-50' : ''}`}
        >
            <div className="truncate flex-1 min-w-0">
                <div className="font-bold text-sm truncate" dangerouslySetInnerHTML={{ __html: song.title }} />
                <div className="text-xs text-gray-500 truncate">{song.artist}</div>
            </div>
            <div className="text-xs font-mono bg-white/10 px-2 py-1 rounded ml-2 group-hover:bg-primary/20 transition-colors shrink-0">
                {song.difficulty}
            </div>
        </div>
    );
};

const AdminDragDrop = ({ songs, onDragEnd, activeId, customSubLevels = [], onAddCustomSubLevel, searchQuery, onSearchChange }) => {
    const [newSubLevelInput, setNewSubLevelInput] = useState('');

    // Extract unique sub_level labels and sort them
    const availableLabels = React.useMemo(() => {
        const labels = new Set();
        songs.forEach(s => {
            if (s.sub_level) {
                const parts = s.sub_level.split('.');
                if (parts.length > 1) {
                    const label = parts.slice(1).join('.');
                    labels.add(label);
                }
            }
        });

        // Add custom sub levels
        customSubLevels.forEach(lbl => labels.add(lbl));

        // Sort labels by rank
        const sorted = Array.from(labels).sort((a, b) => {
            const parseLabel = (lbl) => {
                const match = lbl.match(/^(地力|個人差|未定)\s*([A-Z+\-]*)/);
                if (!match) return { type: '', rank: '' };
                return { type: match[1], rank: match[2] || '未定' };
            };

            const aParsed = parseLabel(a);
            const bParsed = parseLabel(b);

            const rankOrder = { 'S+': 0, 'S': 1, 'A+': 2, 'A': 3, 'B+': 4, 'B': 5, 'C+': 6, 'C': 7, 'D+': 8, 'D': 9, 'E': 10, 'F': 11, '未定': 12 };
            const typeOrder = { '地力': 0, '個人差': 1, '未定': 2 };

            const aRankOrder = rankOrder[aParsed.rank] ?? 99;
            const bRankOrder = rankOrder[bParsed.rank] ?? 99;

            if (aRankOrder !== bRankOrder) {
                return aRankOrder - bRankOrder;
            }

            const aTypeOrder = typeOrder[aParsed.type] ?? 99;
            const bTypeOrder = typeOrder[bParsed.type] ?? 99;

            return aTypeOrder - bTypeOrder;
        });

        return sorted;
    }, [songs, customSubLevels]);

    // Selected sub level state
    const [selectedSubLevel, setSelectedSubLevel] = useState(availableLabels[0] || '');

    // Sync selectedSubLevel if it becomes available or matches the first one
    useEffect(() => {
        if (!selectedSubLevel && availableLabels.length > 0) {
            setSelectedSubLevel(availableLabels[0]);
        }
    }, [availableLabels, selectedSubLevel]);

    const handleAddSubLevel = () => {
        if (newSubLevelInput.trim()) {
            onAddCustomSubLevel(newSubLevelInput.trim());
            setSelectedSubLevel(newSubLevelInput.trim());
            setNewSubLevelInput('');
        }
    };

    // Drop zone for unassigning
    const { setNodeRef: setUnassignRef, isOver: isOverUnassign } = useDroppable({
        id: 'folder-unassigned',
    });

    // Drop zone for selected folder
    const { setNodeRef: setFolderRef, isOver: isOverFolder } = useDroppable({
        id: `folder-${selectedSubLevel}`,
        data: { folderLabel: selectedSubLevel },
    });

    // Songs for the main list (Unassigned)
    const unassignedSongs = React.useMemo(() =>
        songs.filter(s => !s.sub_level)
        , [songs]);

    // Songs in the selected folder
    const folderSongs = React.useMemo(() => {
        if (!selectedSubLevel) return [];
        return songs.filter(s => {
            if (!s.sub_level) return false;
            const parts = s.sub_level.split('.');
            if (parts.length > 1) {
                const label = parts.slice(1).join('.');
                return label === selectedSubLevel;
            }
            return false;
        });
    }, [songs, selectedSubLevel]);

    // Find active song for overlay
    const activeSong = React.useMemo(() =>
        activeId ? songs.find(s => s.id === activeId) : null
        , [activeId, songs]);

    return (
        <div className="w-full overflow-x-hidden">
            {/* Control Bar: Search, SubLevel Selector & Adder */}
            <div className="mb-4 flex flex-col xl:flex-row items-stretch xl:items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/10">
                {/* Search Bar - Moved here per user request */}
                <div className="flex-1 flex items-center gap-2 bg-black/50 rounded-lg px-3 py-2 border border-white/10 focus-within:border-primary transition-colors">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="楽曲検索..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-500"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="text-gray-500 hover:text-white transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="hidden xl:block w-px h-8 bg-white/10"></div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <span className="text-sm font-bold text-gray-400 shrink-0">移動先:</span>
                        <select
                            value={selectedSubLevel}
                            onChange={(e) => setSelectedSubLevel(e.target.value)}
                            className="flex-1 sm:w-48 bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-primary font-bold focus:outline-none focus:border-primary text-sm"
                        >
                            {availableLabels.length === 0 && <option value="">-- 追加してください --</option>}
                            {availableLabels.map(label => (
                                <option key={label} value={label}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                        <input
                            type="text"
                            value={newSubLevelInput}
                            onChange={(e) => setNewSubLevelInput(e.target.value)}
                            placeholder="例: 地力 S+"
                            className="flex-1 sm:w-32 bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubLevel()}
                        />
                        <button
                            onClick={handleAddSubLevel}
                            className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                        >
                            作成
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile warning */}
            <div className="lg:hidden p-4 mb-4 glass rounded-xl text-center text-sm text-yellow-400 border border-yellow-400/20">
                Drag & Drop works best on larger screens. Consider using List View on mobile.
            </div>

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-auto lg:h-[calc(100vh-320px)] overflow-x-hidden">
                {/* Left: Unassigned Songs */}
                <div
                    ref={setUnassignRef}
                    className={`w-full lg:w-1/2 h-[40vh] lg:h-full glass rounded-xl overflow-hidden flex flex-col border transition-colors ${isOverUnassign ? 'border-red-500 bg-red-500/10' : 'border-white/20'}`}
                >
                    <div className={`p-2 sm:p-4 border-b font-bold text-center text-sm sm:text-base transition-colors ${isOverUnassign ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-white/10 bg-black/30'}`}>
                        {isOverUnassign ? 'Drop to Unassign' : `Unassigned Songs (${unassignedSongs.length})`}
                    </div>
                    <Virtuoso
                        style={{ height: '100%' }}
                        data={unassignedSongs}
                        itemContent={(index, song) => <DraggableSong song={song} />}
                        className="custom-scrollbar overflow-x-hidden"
                    />
                </div>

                {/* Right: Selected Folder */}
                <div
                    ref={setFolderRef}
                    className={`w-full lg:w-1/2 h-[40vh] lg:h-full glass rounded-xl overflow-hidden flex flex-col border transition-colors ${isOverFolder ? 'border-primary bg-primary/10' : 'border-white/20'}`}
                >
                    <div className={`p-2 sm:p-4 border-b font-bold text-center text-sm sm:text-base transition-colors ${isOverFolder ? 'border-primary bg-primary/20 text-primary' : 'border-white/10 bg-black/30'}`}>
                        {isOverFolder ? `Drop to assign "${selectedSubLevel}"` : `${selectedSubLevel} (${folderSongs.length})`}
                    </div>
                    <Virtuoso
                        style={{ height: '100%' }}
                        data={folderSongs}
                        itemContent={(index, song) => <DraggableSong song={song} />}
                        className="custom-scrollbar overflow-x-hidden"
                    />
                </div>

                <DragOverlay adjustScale={false}>
                    {activeSong ? (
                        <div className="p-2 sm:p-3 bg-gray-800 rounded shadow-2xl border border-primary w-48 sm:w-64 opacity-90 cursor-grabbing pointer-events-none">
                            <div className="font-bold truncate text-white text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: activeSong.title }} />
                            <div className="text-xs text-primary">{activeSong.difficulty}</div>
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </div>
    );
};

export default AdminDragDrop;
