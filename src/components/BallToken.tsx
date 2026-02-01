import React from 'react';
import { Ball } from '../types';

interface BallTokenProps {
  ball: Ball;
}

export const BallToken: React.FC<BallTokenProps> = ({ ball }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${ball.x}%`,
        top: `${ball.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 100 100">
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
    </div>
  );
};
