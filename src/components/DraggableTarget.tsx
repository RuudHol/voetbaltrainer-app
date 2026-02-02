import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { TargetArea } from '../types';

interface DraggableTargetProps {
  target: TargetArea;
  index?: number; // Voor label bij meerdere doelvakken
  onDelete?: () => void; // Verwijder knop
}

export const DraggableTarget: React.FC<DraggableTargetProps> = ({ target, index = 0, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `target-${target.id}`,
    data: { type: 'target', ...target },
  });

  const dndStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 90, 
  } : undefined;

  // Grootte in rem op basis van radius
  const sizeRem = (target.radius * 6) / 16;
  const shape = target.shape || 'circle';
  
  // Vorm classes
  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-lg',
    rectangle: 'rounded-lg',
  };

  // Rechthoek is breder
  const widthRem = shape === 'rectangle' ? sizeRem * 1.5 : sizeRem;
  const heightRem = sizeRem;
  
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
                width: `${widthRem}rem`,
                height: `${heightRem}rem`,
            }}
            className={`${shapeClasses[shape]} border-4 border-dashed border-yellow-400 bg-yellow-400/30 flex items-center justify-center transition-all relative`}
        >
            <span className="text-xs font-bold text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {index > 0 ? `Doelvak ${index + 1}` : 'Doelvak'}
            </span>
            
            {/* Verwijder knop */}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center"
                >
                    ×
                </button>
            )}
        </div>
    </div>
  );
};
