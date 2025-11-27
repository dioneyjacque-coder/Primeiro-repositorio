export enum Direction {
  UPSTREAM = 'Subindo (Interior)',
  DOWNSTREAM = 'Descendo (Capital)',
}

export interface Route {
  id: string;
  name: string;
  color: string;
}

export interface Stop {
  id: string;
  name: string;
  distanceFromManausKm: number;
  routeIds: string[]; // IDs of routes that stop here
  mapX: number; // Percentage 0-100 for offline map
  mapY: number; // Percentage 0-100 for offline map
}

export interface Boat {
  id: string;
  name: string;
  contact: string;
  capacity: number;
}

export interface Schedule {
  id: string;
  boatId: string;
  stopId: string;
  direction: Direction;
  dayOfWeek: string; // "Segunda", "Terça", etc.
  expectedTime: string; // HH:mm
  departurePort?: string; // Porto de saída em Manaus
}

export interface ArrivalLog {
  id: string;
  boatId: string;
  stopId: string;
  direction: Direction;
  timestamp: number; // Date.now()
  notes: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  groundingUrls?: Array<{uri: string, title: string}>;
  isLoading?: boolean;
}