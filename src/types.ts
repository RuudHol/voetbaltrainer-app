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
export type TargetShape = 'circle' | 'rectangle';

export interface TargetArea {
  id: string;
  x: number;
  y: number;
  width: number;  // Breedte in % van veldbreedte
  height: number; // Hoogte in % van veldhoogte
  radius?: number; // DEPRECATED - voor backwards compatibility
  shape?: TargetShape; // Default: rectangle (circle alleen als width === height)
}

// Route/traject dat de speler moet volgen
export interface RoutePoint {
  x: number; // % van veldbreedte
  y: number; // % van veldhoogte
}

export interface Route {
  id: string;
  points: RoutePoint[]; // Array van punten die de route vormen
  color?: string; // Kleur van de route (default: oranje)
}

// Type oefening
export type ExerciseType = 'position' | 'route'; // position = huidige drag naar doelvak, route = volg de lijn

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
  exerciseType?: ExerciseType; // Type oefening: position (default) of route
  route?: Route; // Route die de speler moet volgen (alleen bij exerciseType: 'route')
}
