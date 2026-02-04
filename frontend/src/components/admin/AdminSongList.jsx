import React, { useMemo } from 'react';
import { TableVirtuoso } from 'react-virtuoso';

const AdminSongList = ({ songs, onSubLevelChange, onClassificationChange, saveStatus, customSubLevels = [], searchQuery, onSearchChange }) => {
    const sortedSongs = useMemo(() => {
        return [...songs].sort((a, b) => {
            // Sort by SubLevel (null last), then Title
            if (a.sub_level === b.sub_level) {
                return a.title.localeCompare(b.title);
            }
            if (a.sub_level === null) return 1;
            if (b.sub_level === null) return -1;
            return parseFloat(a.sub_level) - parseFloat(b.sub_level);
        });
    }, [songs]);

    // Extract unique sub_level labels from all songs (e.g., "地力 S+", "個人差 A")
    const availableSubLevels = useMemo(() => {
        const labels = new Set();
        songs.forEach(song => {
            if (song.sub_level) {
                // Extract label part from "12.地力 S+" -> "地力 S+"
                const parts = song.sub_level.split('.');
                if (parts.length > 1) {
                    const label = parts.slice(1).join('.'); // Handle edge case of multiple dots
                    labels.add(label);
                }
            }
        });

        // Add custom sub levels
        customSubLevels.forEach(lbl => labels.add(lbl));

        // Sort labels by rank (S+ > S > A+ > A...)
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

    // Extract label from sub_level (e.g., "12.地力 S+" -> "地力 S+")
    const getSubLevelLabel = (subLevel) => {
        if (!subLevel) return null;
        const parts = String(subLevel).split('.');
        if (parts.length > 1) {
            return parts.slice(1).join('.');
        }
        return null;
    };

    const handleSelectChange = (song, e) => {
        const value = e.target.value;
        if (value === '--') {
            onSubLevelChange(song.id, null);
        } else {
            // Pass the label (e.g., "地力 S+") to parent
            onSubLevelChange(song.id, value);
        }
    };

    return (
        <div className="flex flex-col gap-4 h-[calc(100vh-200px)] sm:h-[calc(100vh-250px)]">
            {/* Search Bar */}
            <div className="flex items-center gap-2 bg-black/30 p-3 rounded-xl border border-white/10">
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
            </div>

            <div className="flex-1 w-full border border-white/10 rounded-xl overflow-hidden glass">
                <TableVirtuoso
                    data={sortedSongs}
                    className="w-full h-full glass-table"
                    fixedHeaderContent={() => (
                        <tr className="bg-black/40 backdrop-blur-md text-primary font-heading font-bold text-xs sm:text-base">
                            <th className="p-2 sm:p-3 text-left w-[40%] sm:w-[35%]">Title</th>
                            <th className="hidden sm:table-cell p-3 text-left w-[25%]">Artist</th>
                            <th className="p-2 sm:p-3 text-center w-[15%] sm:w-[10%]">Diff</th>
                            <th className="p-2 sm:p-3 text-center w-[20%] sm:w-[15%]">Class</th>
                            <th className="p-2 sm:p-3 text-center w-[25%] sm:w-[15%]">Sub</th>
                        </tr>
                    )}
                    itemContent={(index, song) => (
                        <>
                            <td className="p-2 sm:p-3 border-b border-white/5 truncate text-xs sm:text-base" dangerouslySetInnerHTML={{ __html: song.title }}></td>
                            <td className="hidden sm:table-cell p-3 border-b border-white/5 truncate text-sm text-gray-400">{song.artist}</td>
                            <td className="p-2 sm:p-3 border-b border-white/5 text-center font-bold text-accent text-xs sm:text-base">{song.difficulty}</td>
                            <td className="p-2 sm:p-3 border-b border-white/5 text-center">
                                <select
                                    value={song.classification || 'AC'}
                                    onChange={(e) => onClassificationChange(song.id, e.target.value)}
                                    className="bg-black/50 border border-white/20 rounded px-1 sm:px-2 py-1 text-xs sm:text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
                                    disabled={saveStatus[song.id] === 'saving'}
                                >
                                    <option value="AC">AC</option>
                                    <option value="CS">CS</option>
                                </select>
                            </td>
                            <td className="p-2 sm:p-3 border-b border-white/5 text-center">
                                <div className="flex items-center justify-center">
                                    <select
                                        value={getSubLevelLabel(song.sub_level) || '--'}
                                        onChange={(e) => handleSelectChange(song, e)}
                                        className="bg-black/50 border border-white/20 rounded px-1 sm:px-2 py-1 text-xs sm:text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
                                        disabled={saveStatus[song.id] === 'saving'}
                                    >
                                        <option value="--">--</option>
                                        {availableSubLevels.map(label => (
                                            <option key={label} value={label}>{label}</option>
                                        ))}
                                    </select>
                                    {saveStatus[song.id] === 'saving' && <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-blue-400 shrink-0">...</span>}
                                    {saveStatus[song.id] === 'saved' && <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-green-400 shrink-0">✓</span>}
                                    {saveStatus[song.id] === 'error' && <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-red-400 shrink-0">!</span>}
                                </div>
                            </td>
                        </>
                    )}
                />
            </div>
        </div>
    );
};

export default AdminSongList;
