import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { AdminPlayerRow } from "../components/features/admin/AdminPlayerRow";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Field";
import { Modal } from "../components/ui/Modal";
import { Notice } from "../components/ui/Notice";
import { PageHeader } from "../components/ui/PageHeader";
import { PlayerGridSkeleton } from "../components/ui/Skeleton";
import { useAdminPlayerActions, usePlayerContactDetail, usePlayers } from "../hooks/usePlayers";
import { useSession } from "../hooks/useSession";
import { errorMessage } from "../lib/errors";
import { isAdminSession } from "../lib/roles";
import type { Player } from "../types/player.types";

export function AdminPage() {
  const { sessionName } = useSession();
  const { data: players = [], isLoading } = usePlayers();
  const { data: contactDetail = [] } = usePlayerContactDetail(sessionName);
  const actions = useAdminPlayerActions();
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<Player | null>(null);

  const phoneById = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const detail of contactDetail) map.set(detail.id, detail.phone_number);
    return map;
  }, [contactDetail]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...players].sort((a, b) => a.name.localeCompare(b.name));
    return q ? sorted.filter((p) => p.name.toLowerCase().includes(q)) : sorted;
  }, [players, query]);

  // The nav button is already admin-only, but the route must guard itself too —
  // anyone can type /admin. The real enforcement is server-side; this just keeps
  // the page from rendering for non-admins.
  if (sessionName && !isAdminSession(sessionName)) {
    return <Navigate replace to="/" />;
  }

  const confirmDelete = () => {
    if (!toDelete) return;
    actions.remove.mutate(
      { id: toDelete.id, requestedBy: sessionName },
      { onSuccess: () => setToDelete(null) }
    );
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      <PageHeader title="Squad admin" />
      <p className="text-[17px] leading-relaxed text-fg/80">
        Phone numbers and scouting notes live here. Removing a card keeps past matches and line-ups intact; it only
        unlinks the card.
      </p>

      <Input
        aria-label="Search players"
        placeholder="Search players…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {isLoading ? <PlayerGridSkeleton /> : null}
      {!isLoading ? (
        <p className="text-[15px] font-semibold tabular-nums text-fg/80">
          {filtered.length} {filtered.length === 1 ? "player" : "players"}
        </p>
      ) : null}

      {actions.setNotes.isError ? (
        <Notice tone="error">{errorMessage(actions.setNotes.error, "Could not save notes.")}</Notice>
      ) : null}
      {actions.setPhone.isError ? (
        <Notice tone="error">{errorMessage(actions.setPhone.error, "Could not save this phone number.")}</Notice>
      ) : null}

      <ul className="border-t-2 border-fg">
        {filtered.map((player) => (
          <AdminPlayerRow
            key={player.id}
            player={player}
            savingNotes={actions.setNotes.isPending && actions.setNotes.variables?.id === player.id}
            onSaveNotes={(notes) => actions.setNotes.mutate({ id: player.id, notes, requestedBy: sessionName })}
            phoneNumber={phoneById.get(player.id)}
            savingPhone={actions.setPhone.isPending && actions.setPhone.variables?.id === player.id}
            onSavePhone={(phoneNumber) => actions.setPhone.mutate({ id: player.id, phoneNumber, requestedBy: sessionName })}
            onDelete={() => setToDelete(player)}
          />
        ))}
      </ul>

      <Modal open={toDelete !== null} title="Remove player card" onClose={() => setToDelete(null)}>
        <div className="grid gap-4">
          <p className="text-[17px] leading-relaxed text-fg/80">
            Remove <span className="font-bold text-fg">{toDelete?.name}</span>&rsquo;s card? Their name stays on past
            matches and line-ups; only the card and its ratings are deleted. This can&rsquo;t be undone.
          </p>
          {actions.remove.isError ? (
            <Notice tone="error">{errorMessage(actions.remove.error, "Could not remove this player.")}</Notice>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button disabled={actions.remove.isPending} onClick={confirmDelete}>
              {actions.remove.isPending ? "Removing…" : "Yes, remove it"}
            </Button>
            <Button variant="secondary" onClick={() => setToDelete(null)}>Keep the card</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
