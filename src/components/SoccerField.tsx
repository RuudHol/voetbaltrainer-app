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

// Pilon component (kegel vorm) - verbeterd met gradient
const Cone: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g className="drop-shadow-sm">
    {/* Schaduw */}
    <ellipse cx={x + 2} cy={y + 6} rx={5} ry={2} fill="rgba(0,0,0,0.2)" />
    {/* Basis van de pilon */}
    <ellipse cx={x} cy={y + 4} rx={5} ry={2} fill="#ff7700" />
    {/* Kegel met gradient */}
    <defs>
      <linearGradient id={`cone-gradient-${x}-${y}`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ff8800" />
        <stop offset="50%" stopColor="#ff6600" />
        <stop offset="100%" stopColor="#cc5500" />
      </linearGradient>
    </defs>
    <path 
      d={`M ${x - 5},${y + 4} L ${x},${y - 8} L ${x + 5},${y + 4} Z`}
      fill={`url(#cone-gradient-${x}-${y})`}
      stroke="#cc4400"
      strokeWidth="0.5"
    />
    {/* Witte streep */}
    <path 
      d={`M ${x - 3},${y + 1} L ${x},${y - 4} L ${x + 3},${y + 1}`}
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </g>
);

// Hoekvlag component
const CornerFlag: React.FC<{ x: number; y: number; flip?: boolean }> = ({ x, y, flip }) => (
  <g>
    {/* Paal */}
    <line 
      x1={x} y1={y} 
      x2={x} y2={y - 15} 
      stroke="#f5f5f5" 
      strokeWidth="1.5"
    />
    {/* Vlag */}
    <path 
      d={flip 
        ? `M ${x},${y - 15} L ${x - 8},${y - 12} L ${x},${y - 9} Z`
        : `M ${x},${y - 15} L ${x + 8},${y - 12} L ${x},${y - 9} Z`
      }
      fill="#ff4444"
      stroke="#cc0000"
      strokeWidth="0.5"
    />
  </g>
);

// Doel component met net
const Goal: React.FC<{ x: number; side: 'left' | 'right' }> = ({ x, side }) => {
  const goalWidth = 12;
  const goalHeight = 50;
  const yStart = FIELD_HEIGHT / 2 - goalHeight / 2;
  
  return (
    <g>
      {/* Net patroon */}
      <defs>
        <pattern id={`net-${side}`} width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M 0 0 L 4 4 M 4 0 L 0 4" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" fill="none"/>
        </pattern>
      </defs>
      
      {/* Net achtergrond */}
      {side === 'left' ? (
        <rect x={x - goalWidth} y={yStart} width={goalWidth} height={goalHeight} fill={`url(#net-${side})`} />
      ) : (
        <rect x={x} y={yStart} width={goalWidth} height={goalHeight} fill={`url(#net-${side})`} />
      )}
      
      {/* Doelpalen */}
      <g stroke="white" strokeWidth="4" fill="none" strokeLinecap="round">
        {side === 'left' ? (
          <path d={`M ${x},${yStart} h -${goalWidth} v ${goalHeight} h ${goalWidth}`} />
        ) : (
          <path d={`M ${x},${yStart} h ${goalWidth} v ${goalHeight} h -${goalWidth}`} />
        )}
      </g>
    </g>
  );
};

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
      className="relative w-full max-w-4xl aspect-[425/300] rounded-2xl overflow-hidden shadow-2xl mx-auto select-none"
      onClick={handleFieldClick}
      style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 0 100px rgba(0,0,0,0.1)'
      }}
    >
      {/* Gradient gras basis */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #2d8a4e 0%, #22863a 50%, #1e7e34 100%)'
        }}
      />
      
      {/* Gras strepen - realistischer */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          backgroundImage: `repeating-linear-gradient(
            90deg, 
            rgba(255,255,255,0.03) 0px, 
            rgba(255,255,255,0.03) 35px, 
            transparent 35px, 
            transparent 70px
          )`,
        }}
      />
      
      {/* Subtiele gras textuur */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <svg 
        viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`} 
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Veld omlijning met glow */}
        <defs>
          <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Buitenlijnen */}
        <g stroke="rgba(255,255,255,0.95)" strokeWidth="3" fill="none" filter="url(#line-glow)">
          <rect x="10" y="10" width={FIELD_WIDTH - 20} height={FIELD_HEIGHT - 20} rx="2" />
        </g>

        {/* Stippellijnen tussen pionen */}
        <g stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeDasharray="10,8" fill="none">
          {/* Middenlijn */}
          <line x1={MIDDLE_X} y1="10" x2={MIDDLE_X} y2={FIELD_HEIGHT - 10} />
          {/* Keepersgebied links */}
          <line x1={KEEPER_ZONE_LEFT} y1="10" x2={KEEPER_ZONE_LEFT} y2={FIELD_HEIGHT - 10} />
          {/* Keepersgebied rechts */}
          <line x1={KEEPER_ZONE_RIGHT} y1="10" x2={KEEPER_ZONE_RIGHT} y2={FIELD_HEIGHT - 10} />
        </g>

        {/* Middenstip */}
        <circle cx={MIDDLE_X} cy={FIELD_HEIGHT / 2} r="4" fill="rgba(255,255,255,0.8)" />

        {/* Doelen */}
        <Goal x={10} side="left" />
        <Goal x={FIELD_WIDTH - 10} side="right" />

        {/* Hoekvlaggen */}
        <CornerFlag x={12} y={12} />
        <CornerFlag x={12} y={FIELD_HEIGHT - 12} />
        <CornerFlag x={FIELD_WIDTH - 12} y={12} flip />
        <CornerFlag x={FIELD_WIDTH - 12} y={FIELD_HEIGHT - 12} flip />

        {/* Pionen - Middenlijn */}
        <Cone x={MIDDLE_X} y={8} />
        <Cone x={MIDDLE_X} y={FIELD_HEIGHT - 8} />

        {/* Pionen - Keepersgebied links */}
        <Cone x={KEEPER_ZONE_LEFT} y={8} />
        <Cone x={KEEPER_ZONE_LEFT} y={FIELD_HEIGHT - 8} />

        {/* Pionen - Keepersgebied rechts */}
        <Cone x={KEEPER_ZONE_RIGHT} y={8} />
        <Cone x={KEEPER_ZONE_RIGHT} y={FIELD_HEIGHT - 8} />
      </svg>

      {/* Spelers */}
      {players.map((player) => (
        <PlayerToken key={player.id} player={player} />
      ))}

      {children}
      
      {/* Subtiele rand bovenop */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
        boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.1)'
      }} />
    </div>
  );
};
