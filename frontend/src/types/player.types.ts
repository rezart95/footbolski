export type PlayerPosition = "GK" | "DEF" | "MID" | "ATT";

export type PlayerAttribute =
  | "fast"
  | "technical"
  | "physical"
  | "leader"
  | "aerial"
  | "creative"
  | "defensive"
  | "clinical";

export interface Player {
  id: string;
  name: string;
  photo_url: string | null;
  skill_rating: number;
  primary_position: PlayerPosition;
  attributes: PlayerAttribute[];
  age?: number | null;
  height_cm?: number | null;
  build?: string | null;
  preferred_role?: string | null;
  speed?: number | null;
  technique?: number | null;
  defending?: number | null;
  shooting?: number | null;
  aerial?: number | null;
  stamina?: number | null;
  work_rate?: number | null;
}

export interface PlayerPayload {
  name: string;
  photo_url?: string | null;
  skill_rating: number;
  primary_position: PlayerPosition;
  attributes: PlayerAttribute[];
  age?: number | null;
  height_cm?: number | null;
  build?: string | null;
  preferred_role?: string | null;
  speed?: number | null;
  technique?: number | null;
  defending?: number | null;
  shooting?: number | null;
  aerial?: number | null;
  stamina?: number | null;
  work_rate?: number | null;
}
