import type { PlayerPosition } from "./player.types";

export interface TeamPlayer {
  id: string;
  player_id: string | null;
  display_name: string;
  position_role: PlayerPosition;
  pitch_x: number | null;
  pitch_y: number | null;
}

export interface Team {
  id: string;
  event_id: string;
  label: "Team A" | "Team B" | string;
  color: "green" | "white" | string;
  formation: string | null;
  players: TeamPlayer[];
}

export interface FormationPayload {
  team_id: string;
  formation: string;
  players: Array<{ id: string; pitch_x: number; pitch_y: number }>;
}
