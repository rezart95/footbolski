import { api } from "../lib/axios";
import type { EventSummary } from "../types/event.types";

export interface InviteView {
  spent: boolean;
  player_name: string;
  event: EventSummary;
}

export type InviteOutcome =
  | "confirmed"
  | "waitlisted"
  | "already_registered"
  | "event_cancelled";

export interface InviteResult {
  outcome: InviteOutcome;
  list_status?: string;
  position?: number;
  event_id: string;
  event: EventSummary;
}

export interface BallotCandidate {
  id: string;
  name: string;
  photo_url: string | null;
}

export type BallotState =
  | "open"
  | "already_voted"
  | "closed"
  | "not_enough_players";

export interface BallotView {
  state: BallotState;
  event_id: string;
  voter_name: string;
  closes_at: string;
  candidates: BallotCandidate[];
}

export interface MotmWinner {
  id: string;
  name: string;
  photo_url: string | null;
}

export interface MotmResult {
  state: "pending" | "open" | "no_votes" | "decided";
  votes?: number;
  winners: MotmWinner[];
  closes_at: string | null;
}

export async function getInvite(token: string) {
  const { data } = await api.get<InviteView>(`/invite/${token}`);
  return data;
}

export async function confirmInvite(token: string) {
  const { data } = await api.post<InviteResult>(`/invite/${token}/confirm`);
  return data;
}

export async function getBallot(token: string) {
  const { data } = await api.get<BallotView>(`/motm/${token}`);
  return data;
}

export async function castVote(token: string, nomineePlayerId: string) {
  const { data } = await api.post(`/motm/${token}/vote`, {
    nominee_player_id: nomineePlayerId
  });
  return data;
}

export async function getMotmResult(eventId: string) {
  const { data } = await api.get<MotmResult>(`/events/${eventId}/motm`);
  return data;
}
