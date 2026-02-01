import React from 'react';
import { Player, PlayerColor } from '../types';
import { clsx } from 'clsx';

interface PlayerTokenProps {
  player: Player;
  isDraggable?: boolean;
  style?: React.CSSProperties;
  // Eventuele andere props voor dnd-kit later
}

const colorClasses: Record<PlayerColor, string> = {
  keeper1: 'bg-green-500 border-green-700 text-white', // Keeper team 1 (groen)
  team1: 'bg-red-500 border-red-700 text-white',       // Spelers team 1 (rood)
  team2: 'bg-blue-500 border-blue-700 text-white',     // Spelers team 2 (blauw)
  keeper2: 'bg-yellow-400 border-yellow-600 text-black', // Keeper team 2 (geel)
};

export const PlayerToken: React.FC<PlayerTokenProps> = ({ player, style, isDraggable }) => {
  return (
    <div
      className={clsx(
        "w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm shadow-md select-none",
        colorClasses[player.color],
        isDraggable && "cursor-move hover:scale-110 transition-transform"
      )}
      style={{
        ...style,
        // We positioneren absoluut als x/y gegeven zijn en we in een container zitten die relative is
        // Maar voor dnd-kit gebruiken we vaak transform.
        // Laten we aannemen dat de parent de positionering regelt via style prop of absolute positie hier als fallback
        position: 'absolute',
        left: `${player.x}%`,
        top: `${player.y}%`,
        transform: 'translate(-50%, -50%)', // Zodat x,y het midden is
      }}
    >
      {player.number}
    </div>
  );
};
