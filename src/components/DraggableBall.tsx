import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Ball } from '../types';

interface DraggableBallProps {
  ball: Ball;
  onDelete?: () => void;
}

export const DraggableBall: React.FC<DraggableBallProps> = ({ ball, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'ball',
    data: { type: 'ball', ...ball },
  });

  const dndStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 95,
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={{
        ...dndStyle,
        position: 'absolute',
        left: `${ball.x}%`,
        top: `${ball.y}%`,
      }}
      {...listeners} 
      {...attributes} 
      className="touch-none cursor-move hover:scale-110 transition-transform group"
    >
      <div style={{ transform: 'translate(-50%, -50%)' }} className="relative">
        <svg width="24" height="24" viewBox="0 0 100 100" className="drop-shadow-lg">
          {/* Witte achtergrond */}
          <circle cx="50" cy="50" r="45" fill="white" stroke="#333" strokeWidth="3"/>
          
          {/* Zwarte pentagon in het midden */}
          <polygon 
            points="50,25 65,40 60,58 40,58 35,40" 
            fill="#1a1a1a"
          />
          
          {/* Zwarte vlakken aan de randen */}
          <polygon points="50,5 62,20 38,20" fill="#1a1a1a"/>
          <polygon points="85,35 75,25 70,40 78,52" fill="#1a1a1a"/>
          <polygon points="85,65 78,48 70,60 75,75" fill="#1a1a1a"/>
          <polygon points="50,95 62,80 38,80" fill="#1a1a1a"/>
          <polygon points="15,65 22,48 30,60 25,75" fill="#1a1a1a"/>
          <polygon points="15,35 25,25 30,40 22,52" fill="#1a1a1a"/>
        </svg>
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
    </div>
  );
};
