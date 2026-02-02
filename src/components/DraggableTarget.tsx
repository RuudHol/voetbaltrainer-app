import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { TargetArea } from '../types';

interface DraggableTargetProps {
  target: TargetArea;
}

export const DraggableTarget: React.FC<DraggableTargetProps> = ({ target }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'target-area',
    data: { type: 'target', ...target },
  });

  const dndStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 90, 
  } : undefined;

  // Bereken de grootte op basis van de radius (radius is in % van veldbreedte)
  // We gebruiken vw-achtige berekening: radius * 2 als percentage
  const sizePercent = target.radius * 2;
  
  return (
    <div 
      ref={setNodeRef} 
      style={{
        ...dndStyle,
        position: 'absolute',
        left: `${target.x}%`,
        top: `${target.y}%`,
      }}
      {...listeners} 
      {...attributes} 
      className="touch-none cursor-move group"
    >
        <div 
            style={{ 
                transform: 'translate(-50%, -50%)',
                width: `${sizePercent}%`,
                paddingBottom: `${sizePercent}%`, // Vierkant houden via padding trick
            }}
            className="relative"
        >
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-yellow-400 bg-yellow-400/30 flex items-center justify-center transition-all">
                <span className="text-xs font-bold text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Doelvak
                </span>
            </div>
        </div>
    </div>
  );
};
