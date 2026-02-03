import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { PlayerToken } from './PlayerToken';
import { Player } from '../types';

interface DraggablePlayerProps {
  player: Player;
  onDelete?: () => void;
}

export const DraggablePlayer: React.FC<DraggablePlayerProps> = ({ player, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: player.id,
    data: player,
  });

  // dnd-kit transform voor beweging. 
  // We gebruiken translate3d voor hardware acceleratie.
  const dndStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 100, // Zorg dat gesleepte item bovenop ligt
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={{
        ...dndStyle,
        position: 'absolute',
        left: `${player.x}%`,
        top: `${player.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      {...listeners} 
      {...attributes} 
      className="touch-none cursor-move group"
    >
      <PlayerToken player={player} isDraggable selfPositioned={false} />
      {/* Verwijder knop */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center z-10"
        >
          ×
        </button>
      )}
    </div>
  );
};
