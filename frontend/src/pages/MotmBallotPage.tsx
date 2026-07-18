import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import { LinkLayout } from "../components/layout/LinkLayout";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { castVote, getBallot } from "../services/links.service";
import type { BallotCandidate, BallotView } from "../services/links.service";
import { cn } from "../lib/utils";

/** The Man of the Match ballot, reached from a WhatsApp link after full time.
 *
 * Single column with a pinned button (design decision D9): a two-column photo
 * grid truncates long surnames at 320px, and thirteen players in two columns
 * pushes the confirm button well below the fold. Used once, at night, outdoors,
 * one-handed — so every name must be legible and the action always reachable. */
export function MotmBallotPage() {
  const { token = "" } = useParams();
  const [ballot, setBallot] = useState<BallotView | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBallot(token)
      .then((data) => !cancelled && setBallot(data))
      .catch(() => !cancelled && setError("This voting link is not valid."));
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function submit() {
    if (!picked) return;
    setSubmitting(true);
    setError(null);
    try {
      await castVote(token, picked);
      setVoted(true);
    } catch {
      setError("Your vote could not be saved. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !ballot) {
    return (
      <LinkLayout>
        <h1 className="font-display text-2xl font-bold">Link not valid</h1>
        <p className="mt-2 text-sm text-white/60">{error}</p>
      </LinkLayout>
    );
  }

  if (!ballot) {
    return (
      <LinkLayout>
        <div className="grid gap-3">
          <Skeleton className="h-8 w-64" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton className="h-14 w-full rounded-lg" key={i} />
          ))}
        </div>
      </LinkLayout>
    );
  }

  if (voted) {
    return (
      <LinkLayout>
        <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-pitch-400/15 text-pitch-400">
          <Check size={22} strokeWidth={3} />
        </div>
        <h1 className="font-display text-3xl font-bold leading-tight">Vote recorded</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Nobody can see who you picked. The result appears on the match page once voting closes.
        </p>
        <Link className="mt-6 inline-block" to={`/events/${ballot.event_id}`}>
          <Button variant="secondary">Go to the match</Button>
        </Link>
      </LinkLayout>
    );
  }

  if (ballot.state !== "open") {
    return (
      <LinkLayout>
        <h1 className="font-display text-2xl font-bold leading-tight">
          {ballot.state === "already_voted"
            ? "You've already voted"
            : ballot.state === "closed"
              ? "Voting has closed"
              : "Not enough players"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          {ballot.state === "already_voted"
            ? "Your vote is in. Results appear on the match page once voting closes."
            : ballot.state === "closed"
              ? "The result is on the match page."
              : "A vote needs at least two players on the pitch."}
        </p>
        <Link className="mt-6 inline-block" to={`/events/${ballot.event_id}`}>
          <Button variant="secondary">Go to the match</Button>
        </Link>
      </LinkLayout>
    );
  }

  const pickedName = ballot.candidates.find((c) => c.id === picked)?.name.split(" ")[0];

  return (
    <LinkLayout>
      <h1 className="font-display text-2xl font-bold leading-tight">
        Who was Man of the Match?
      </h1>
      <p className="mt-1.5 text-sm font-semibold text-white/50">
        Your vote is secret. Only the winner is ever shown.
      </p>

      {/* Radio semantics, not a pile of buttons: a screen reader must announce
          the group and which option is chosen. */}
      <div
        aria-label="Man of the Match candidates"
        className="mt-5 grid gap-1.5 pb-28"
        role="radiogroup"
      >
        {ballot.candidates.map((candidate) => (
          <CandidateRow
            candidate={candidate}
            key={candidate.id}
            onSelect={() => setPicked(candidate.id)}
            selected={picked === candidate.id}
          />
        ))}
      </div>

      {error ? (
        <p className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] mx-auto max-w-lg px-5 text-center text-sm font-semibold text-red-300">
          {error}
        </p>
      ) : null}

      {/* Pinned: thirteen rows would otherwise bury the action below the fold. */}
      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-pitch-950 via-pitch-950/95 to-transparent px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-6">
        <div className="mx-auto max-w-lg">
          <Button
            className="w-full"
            disabled={!picked || submitting}
            onClick={() => void submit()}
          >
            {submitting ? "Saving…" : picked ? `Confirm vote — ${pickedName}` : "Pick a player"}
          </Button>
        </div>
      </div>
    </LinkLayout>
  );
}

function CandidateRow({
  candidate,
  selected,
  onSelect
}: {
  candidate: BallotCandidate;
  selected: boolean;
  onSelect: () => void;
}) {
  const initials = candidate.name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <button
      aria-checked={selected}
      className={cn(
        "tap-target flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition active:scale-[0.99]",
        selected
          ? "border-pitch-400 bg-pitch-400/12"
          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
      )}
      onClick={onSelect}
      role="radio"
      type="button"
    >
      {candidate.photo_url ? (
        <img
          alt=""
          className="h-8 w-8 flex-none rounded-full object-cover"
          src={candidate.photo_url}
        />
      ) : (
        // Initials rather than a broken image or an empty grey circle.
        <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-white/12 text-[0.65rem] font-extrabold text-white/60">
          {initials}
        </span>
      )}
      <span className="min-w-0 flex-1 text-sm font-semibold">{candidate.name}</span>
      {selected ? <Check className="flex-none text-pitch-400" size={18} strokeWidth={3} /> : null}
    </button>
  );
}
