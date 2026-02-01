import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { PlayerToken } from './PlayerToken';
import { Player } from '../types';

interface DraggablePlayerProps {
  player: Player;
}

export const DraggablePlayer: React.FC<DraggablePlayerProps> = ({ player }) => {
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
      className="touch-none cursor-move"
    >
      <PlayerToken player={player} isDraggable selfPositioned={false} />
    </div>
  );
};
