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
}

export interface PlayerPayload {
  name: string;
  photo_url?: string | null;
  skill_rating: number;
  primary_position: PlayerPosition;
  attributes: PlayerAttribute[];
}
