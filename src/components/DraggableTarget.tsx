import React, { useRef, useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { TargetArea } from '../types';

interface DraggableTargetProps {
  target: TargetArea;
  index?: number;
  onDelete?: () => void;
  onResize?: (id: string, width: number, height: number) => void;
  fieldRef?: React.RefObject<HTMLDivElement | null>;
}

// Helper om backwards compatible te zijn met oude radius-based targets
const getTargetSize = (target: TargetArea) => {
  if (target.width !== undefined && target.height !== undefined) {
    return { width: target.width, height: target.height };
  }
  // Backwards compatibility: radius naar width/height
  const size = (target.radius || 8) * 1.5;
  return { width: size, height: size };
};

export const DraggableTarget: React.FC<DraggableTargetProps> = ({ 
  target, 
  index = 0, 
  onDelete,
  onResize,
  fieldRef
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `target-${target.id}`,
    data: { type: 'target', ...target },
  });

  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  const [fieldSize, setFieldSize] = useState({ width: 0, height: 0 });
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const { width, height } = getTargetSize(target);
  const isCircle = target.shape === 'circle' || Math.abs(width - height) < 0.5;

  // Meet het veld om pixels te kunnen berekenen
  useEffect(() => {
    const updateSize = () => {
      if (fieldRef?.current) {
        const rect = fieldRef.current.getBoundingClientRect();
        setFieldSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [fieldRef]);

  // Bereken pixels op basis van veldgrootte
  const widthPx = fieldSize.width > 0 ? (width / 100) * fieldSize.width : 80;
  const heightPx = fieldSize.height > 0 ? (height / 100) * fieldSize.height : 80;

  const dndStyle = transform && !isResizing ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 90, 
  } : { zIndex: isResizing ? 100 : 90 };

  // Resize handlers
  const handleResizeStart = (e: React.PointerEvent, corner: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    setResizeCorner(corner);
    startPos.current = { 
      x: e.clientX, 
      y: e.clientY, 
      width, 
      height 
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!isResizing || !fieldRef?.current || !onResize) return;

    const rect = fieldRef.current.getBoundingClientRect();
    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;
    
    // Convert pixels to percentage
    const deltaWidthPercent = (deltaX / rect.width) * 100 * 2; // *2 want we slepen vanaf centrum
    const deltaHeightPercent = (deltaY / rect.height) * 100 * 2;

    let newWidth = startPos.current.width;
    let newHeight = startPos.current.height;

    // Pas aan op basis van welke hoek/zijde wordt gesleept
    if (resizeCorner?.includes('e')) {
      newWidth = Math.max(3, startPos.current.width + deltaWidthPercent);
    } else if (resizeCorner?.includes('w')) {
      newWidth = Math.max(3, startPos.current.width - deltaWidthPercent);
    }
    
    if (resizeCorner?.includes('s')) {
      newHeight = Math.max(3, startPos.current.height + deltaHeightPercent);
    } else if (resizeCorner?.includes('n')) {
      newHeight = Math.max(3, startPos.current.height - deltaHeightPercent);
    }

    // Voor cirkel: maak width en height gelijk
    if (isCircle || e.shiftKey) {
      const maxSize = Math.max(newWidth, newHeight);
      newWidth = maxSize;
      newHeight = maxSize;
    }

    onResize(target.id, newWidth, newHeight);
  };

  const handleResizeEnd = (e: React.PointerEvent) => {
    if (!isResizing) return;
    
    setIsResizing(false);
    setResizeCorner(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Resize handle component
  const ResizeHandle = ({ position, cursor }: { position: string; cursor: string }) => {
    const positionClasses: Record<string, string> = {
      'nw': '-top-1.5 -left-1.5',
      'ne': '-top-1.5 -right-1.5',
      'sw': '-bottom-1.5 -left-1.5',
      'se': '-bottom-1.5 -right-1.5',
      'n': '-top-1.5 left-1/2 -translate-x-1/2',
      's': '-bottom-1.5 left-1/2 -translate-x-1/2',
      'e': 'top-1/2 -right-1.5 -translate-y-1/2',
      'w': 'top-1/2 -left-1.5 -translate-y-1/2',
    };

    return (
      <div
        className={`absolute ${positionClasses[position]} w-3 h-3 bg-amber-500 border-2 border-white rounded-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-600 hover:scale-125`}
        style={{ cursor }}
        onPointerDown={(e) => handleResizeStart(e, position)}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeEnd}
        onPointerCancel={handleResizeEnd}
      />
    );
  };

  return (
    <div 
      ref={setNodeRef} 
      style={{
        ...dndStyle,
        position: 'absolute',
        left: `${target.x}%`,
        top: `${target.y}%`,
      }}
      {...(isResizing ? {} : listeners)}
      {...(isResizing ? {} : attributes)}
      className="touch-none cursor-move group"
    >
      <div 
        style={{ 
          transform: 'translate(-50%, -50%)',
          width: `${widthPx}px`,
          height: `${heightPx}px`,
          minWidth: '40px',
          minHeight: '40px',
        }}
        className={`${isCircle ? 'rounded-full' : 'rounded-lg'} border-4 border-dashed border-yellow-400 bg-yellow-400/30 flex items-center justify-center transition-colors relative`}
      >
        <span className="text-xs font-bold text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {index > 0 ? `Doelvak ${index + 1}` : 'Doelvak'}
        </span>
        
        {/* Resize handles - alleen in editor mode (als onResize beschikbaar is) */}
        {onResize && (
          <>
            {/* Hoeken */}
            <ResizeHandle position="nw" cursor="nw-resize" />
            <ResizeHandle position="ne" cursor="ne-resize" />
            <ResizeHandle position="sw" cursor="sw-resize" />
            <ResizeHandle position="se" cursor="se-resize" />
            {/* Zijden - alleen voor rechthoeken */}
            {!isCircle && (
              <>
                <ResizeHandle position="n" cursor="n-resize" />
                <ResizeHandle position="s" cursor="s-resize" />
                <ResizeHandle position="e" cursor="e-resize" />
                <ResizeHandle position="w" cursor="w-resize" />
              </>
            )}
          </>
        )}
        
        {/* Verwijder knop */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center z-10"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
