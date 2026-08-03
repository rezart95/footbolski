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

  // The nav button is already admin-only, but the route must guard itself too —
  // anyone can type /admin. The real enforcement is server-side; this just keeps
  // the page from rendering for non-admins.
  if (sessionName && !isAdminSession(sessionName)) {
    return <Navigate replace to="/" />;
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...players].sort((a, b) => a.name.localeCompare(b.name));
    return q ? sorted.filter((p) => p.name.toLowerCase().includes(q)) : sorted;
  }, [players, query]);

  const confirmDelete = () => {
    if (!toDelete) return;
    actions.remove.mutate(
      { id: toDelete.id, requestedBy: sessionName },
      { onSuccess: () => setToDelete(null) }
    );
  };

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Admin" title="Manage squad" />
      <Notice>Edit scouting notes or remove a player card. Removing a card keeps past events and line-ups intact — it just unlinks the card.</Notice>

      <Input
        aria-label="Search players"
        placeholder="Search players…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {isLoading ? <PlayerGridSkeleton /> : null}
      {!isLoading ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-white/45">
          {filtered.length} {filtered.length === 1 ? "player" : "players"}
        </p>
      ) : null}

      {actions.setNotes.isError ? (
        <Notice tone="error">{errorMessage(actions.setNotes.error, "Could not save notes.")}</Notice>
      ) : null}
      {actions.setPhone.isError ? (
        <Notice tone="error">{errorMessage(actions.setPhone.error, "Could not save this phone number.")}</Notice>
      ) : null}

      <div className="grid gap-3">
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
      </div>

      <Modal open={toDelete !== null} title="Remove player card" onClose={() => setToDelete(null)}>
        <div className="grid gap-4">
          <p className="text-white/70">
            Remove <span className="font-bold text-white">{toDelete?.name}</span>'s card? Their name stays on any past
            events and team line-ups — only the card and its ratings are deleted. This can't be undone.
          </p>
          {actions.remove.isError ? (
            <Notice tone="error">{errorMessage(actions.remove.error, "Could not remove this player.")}</Notice>
          ) : null}
          <div className="flex gap-3">
            <Button disabled={actions.remove.isPending} variant="danger" onClick={confirmDelete}>
              {actions.remove.isPending ? "Removing…" : "Yes, remove"}
            </Button>
            <Button variant="secondary" onClick={() => setToDelete(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
