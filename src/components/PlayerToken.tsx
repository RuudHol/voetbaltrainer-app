import React from 'react';
import { Player, PlayerColor } from '../types';
import { clsx } from 'clsx';

interface PlayerTokenProps {
  player: Player;
  isDraggable?: boolean;
  style?: React.CSSProperties;
  /** Als true, positioneert PlayerToken zichzelf. Als false, doet de parent dat. */
  selfPositioned?: boolean;
}

// Kleuren voor de shirts
const shirtColors: Record<PlayerColor, { fill: string; stroke: string; text: string }> = {
  keeper1: { fill: '#22c55e', stroke: '#15803d', text: 'white' },   // Groen
  team1: { fill: '#ef4444', stroke: '#b91c1c', text: 'white' },     // Rood
  team2: { fill: '#3b82f6', stroke: '#1d4ed8', text: 'white' },     // Blauw
  keeper2: { fill: '#facc15', stroke: '#ca8a04', text: 'black' },   // Geel
};

// SVG voetbalshirt component
const ShirtIcon: React.FC<{ color: PlayerColor; number: number }> = ({ color, number }) => {
  const colors = shirtColors[color];
  return (
    <svg viewBox="0 0 40 44" className="w-7 h-8 drop-shadow-md">
      {/* Shirt body */}
      <path
        d="M8 12 L2 8 L6 2 L14 6 L16 4 L24 4 L26 6 L34 2 L38 8 L32 12 L32 42 L8 42 Z"
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="2"
      />
      {/* Kraag */}
      <path
        d="M16 4 Q20 8 24 4"
        fill="none"
        stroke={colors.stroke}
        strokeWidth="1.5"
      />
      {/* Nummer */}
      <text
        x="20"
        y="28"
        textAnchor="middle"
        fill={colors.text}
        fontSize="14"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        {number}
      </text>
    </svg>
  );
};

export const PlayerToken: React.FC<PlayerTokenProps> = ({ player, style, isDraggable, selfPositioned = true }) => {
  return (
    <div
      className={clsx(
        "select-none",
        isDraggable && "cursor-move hover:scale-110 transition-transform"
      )}
      style={selfPositioned ? {
        ...style,
        position: 'absolute',
        left: `${player.x}%`,
        top: `${player.y}%`,
        transform: 'translate(-50%, -50%)',
      } : style}
    >
      <ShirtIcon color={player.color} number={player.number ?? 0} />
    </div>
  );
};
