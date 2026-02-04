import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function SortableSongItem({
  song,
  saveStatus,
  onSubLevelChange,
  onSubLevelSave,
  onClearSubLevel,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return <span className="text-yellow-500">保存中...</span>;
      case 'saved':
        return <span className="text-green-500">✓</span>;
      case 'error':
        return <span className="text-red-500">エラー</span>;
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-12 gap-2 p-2 border-b dark:border-gray-600 items-center hover:bg-gray-50 dark:hover:bg-gray-800 ${
        isDragging ? 'bg-blue-50 dark:bg-blue-900' : ''
      }`}
    >
      {/* Drag handle */}
      <div
        className="col-span-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
      </div>

      {/* Title */}
      <div className="col-span-4 truncate font-medium" title={song.title}>
        {song.title}
      </div>

      {/* Artist */}
      <div className="col-span-2 truncate text-sm text-gray-600 dark:text-gray-400" title={song.artist}>
        {song.artist}
      </div>

      {/* Difficulty */}
      <div className="col-span-2 text-sm">
        {song.difficulty}
      </div>

      {/* Sub Level input */}
      <div className="col-span-2 flex gap-1">
        <input
          type="text"
          value={song.sub_level || ''}
          onChange={(e) => onSubLevelChange(song.id, e.target.value || null)}
          onBlur={() => onSubLevelSave(song.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSubLevelSave(song.id);
            }
          }}
          placeholder="未分類"
          className="w-20 border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-600"
        />
        {song.sub_level && (
          <button
            onClick={() => onClearSubLevel(song.id)}
            className="text-gray-400 hover:text-red-500 text-sm"
            title="クリア"
          >
            ×
          </button>
        )}
      </div>

      {/* Status */}
      <div className="col-span-1 text-sm">
        {getStatusIndicator()}
      </div>
    </div>
  );
}
