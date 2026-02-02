export type PlayerColor = 'keeper1' | 'team1' | 'team2' | 'keeper2';

// Wat de speler moet verslepen in de quiz
export type DraggableType = 'keeper1' | 'team1' | 'team2' | 'keeper2' | 'ball';

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

// Vorm van het doelvak
export type TargetShape = 'circle' | 'rectangle' | 'square';

export interface TargetArea {
  id: string;
  x: number;
  y: number;
  radius: number; // Grootte (voor alle vormen)
  shape?: TargetShape; // Default: circle
}

export interface Situation {
  id: string;
  question: string;
  questionAudio?: string; // Base64 encoded audio
  players: Player[];
  ball?: Ball;
  targetArea: TargetArea; // Backwards compatibility - eerste doelvak
  targetAreas?: TargetArea[]; // Meerdere doelvakken
  draggableType?: DraggableType; // Wat moet de speler verslepen? Default: team1 shirt
  answerCount?: number; // Hoeveel symbolen moet de speler plaatsen? Default: 1
}
