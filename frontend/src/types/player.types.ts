export type PlayerPosition = "GK" | "DEF" | "MID" | "ATT";

export interface Player {
  id: string;
  name: string;
  photo_url: string | null;
  skill_rating: number;
  primary_position: PlayerPosition;
  age?: number | null;
  height_cm?: number | null;
  build?: string | null;
  preferred_role?: string | null;
  speed?: number | null;
  technique?: number | null;
  defending?: number | null;
  shooting?: number | null;
  aerial?: number | null;
  passing?: number | null;
  stamina?: number | null;
  work_rate?: number | null;
  notes?: string | null;
}

/** Admin-portal view of a player's phone number — carries the actual digits,
 * unlike every other player-facing response. See `players.service.ts`. */
export interface PlayerContactDetail {
  id: string;
  name: string;
  phone_number: string | null;
}

export interface PlayerPayload {
  name: string;
  photo_url?: string | null;
  skill_rating: number;
  primary_position: PlayerPosition;
  age?: number | null;
  height_cm?: number | null;
  build?: string | null;
  preferred_role?: string | null;
  speed?: number | null;
  technique?: number | null;
  defending?: number | null;
  shooting?: number | null;
  aerial?: number | null;
  passing?: number | null;
  stamina?: number | null;
  work_rate?: number | null;
}