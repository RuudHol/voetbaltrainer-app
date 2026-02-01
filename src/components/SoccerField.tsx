import React from 'react';
import { Player } from '../types';
import { PlayerToken } from './PlayerToken';

// JO8 veld: 42.5m breed x 30m diep (horizontaal weergegeven)
const FIELD_WIDTH = 425;  // 42.5m
const FIELD_HEIGHT = 300; // 30m

// Posities voor pionen (in units)
const MIDDLE_X = FIELD_WIDTH / 2; // Midden van het veld
const KEEPER_ZONE_LEFT = 70;       // 7m vanaf links
const KEEPER_ZONE_RIGHT = FIELD_WIDTH - 70; // 7m vanaf rechts

interface SoccerFieldProps {
  players?: Player[];
  onFieldClick?: (x: number, y: number) => void;
  children?: React.ReactNode;
}

// Pilon component (kegel vorm)
const Cone: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    {/* Basis van de pilon */}
    <ellipse cx={x} cy={y + 4} rx={5} ry={2} fill="#ff6600" />
    {/* Kegel */}
    <path 
      d={`M ${x - 5},${y + 4} L ${x},${y - 8} L ${x + 5},${y + 4} Z`}
      fill="#ff6600"
      stroke="#cc5500"
      strokeWidth="0.5"
    />
    {/* Witte streep */}
    <path 
      d={`M ${x - 3},${y + 1} L ${x},${y - 4} L ${x + 3},${y + 1}`}
      fill="none"
      stroke="white"
      strokeWidth="1.5"
    />
  </g>
);

export const SoccerField: React.FC<SoccerFieldProps> = ({ players = [], onFieldClick, children }) => {
  const handleFieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onFieldClick) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    onFieldClick(x, y);
  };

  return (
    <div 
      className="relative w-full max-w-4xl aspect-[425/300] bg-green-600 border-4 border-white rounded-lg overflow-hidden shadow-2xl mx-auto select-none"
      onClick={handleFieldClick}
    >
      {/* Gras strepen */}
      <div className="absolute inset-0 opacity-15 pointer-events-none" 
           style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.1) 40px, rgba(0,0,0,0.1) 80px)' }}>
      </div>

      <svg 
        viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`} 
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Buitenlijnen */}
        <g stroke="white" strokeWidth="3" fill="none" opacity="0.9">
          <rect x="10" y="10" width={FIELD_WIDTH - 20} height={FIELD_HEIGHT - 20} />
        </g>

        {/* Stippellijnen tussen pionen */}
        <g stroke="white" strokeWidth="2" strokeDasharray="8,6" fill="none" opacity="0.7">
          {/* Middenlijn */}
          <line x1={MIDDLE_X} y1="10" x2={MIDDLE_X} y2={FIELD_HEIGHT - 10} />
          {/* Keepersgebied links */}
          <line x1={KEEPER_ZONE_LEFT} y1="10" x2={KEEPER_ZONE_LEFT} y2={FIELD_HEIGHT - 10} />
          {/* Keepersgebied rechts */}
          <line x1={KEEPER_ZONE_RIGHT} y1="10" x2={KEEPER_ZONE_RIGHT} y2={FIELD_HEIGHT - 10} />
        </g>

        {/* Doelen (kleine doeltjes - 4m breed) */}
        <g stroke="white" strokeWidth="4" fill="none">
          {/* Doel links */}
          <path d={`M 10,${FIELD_HEIGHT/2 - 20} h -8 v 40 h 8`} />
          {/* Doel rechts */}
          <path d={`M ${FIELD_WIDTH - 10},${FIELD_HEIGHT/2 - 20} h 8 v 40 h -8`} />
        </g>

        {/* Pionen - Middenlijn (boven en onder) */}
        <Cone x={MIDDLE_X} y={5} />
        <Cone x={MIDDLE_X} y={FIELD_HEIGHT - 5} />

        {/* Pionen - Keepersgebied links */}
        <Cone x={KEEPER_ZONE_LEFT} y={5} />
        <Cone x={KEEPER_ZONE_LEFT} y={FIELD_HEIGHT - 5} />

        {/* Pionen - Keepersgebied rechts */}
        <Cone x={KEEPER_ZONE_RIGHT} y={5} />
        <Cone x={KEEPER_ZONE_RIGHT} y={FIELD_HEIGHT - 5} />
      </svg>

      {/* Spelers */}
      {players.map((player) => (
        <PlayerToken key={player.id} player={player} />
      ))}

      {children}
    </div>
  );
};
