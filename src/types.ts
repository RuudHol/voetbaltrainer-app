export type PlayerColor = 'keeper1' | 'team1' | 'team2' | 'keeper2';

export interface Player {
  id: string;
  x: number;
  y: number;
  color: PlayerColor;
  number?: number;
}

export interface Ball {
  x: number;
  y: number;
}

export interface TargetArea {
  x: number;
  y: number;
  radius: number;
}

export interface Situation {
  id: string;
  question: string;
  questionAudio?: string; // Base64 encoded audio
  players: Player[];
  ball?: Ball;
  targetArea: TargetArea;
}
