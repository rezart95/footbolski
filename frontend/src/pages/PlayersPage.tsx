import { useState } from "react";
import { Plus } from "lucide-react";
import { PlayerEditModal } from "../components/features/players/PlayerEditModal";
import { PlayerGrid } from "../components/features/players/PlayerGrid";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Notice } from "../components/ui/Notice";
import { usePlayerActions, usePlayers } from "../hooks/usePlayers";
import { useSession } from "../hooks/useSession";
import { errorMessage } from "../lib/errors";
import { enablePushForUser } from "../lib/push";
import type { Player, PlayerPayload } from "../types/player.types";

export function PlayersPage() {
  const { data: players = [], isLoading } = usePlayers();
  const { sessionName } = useSession();
  const actions = usePlayerActions();
  const [selected, setSelected] = useState<Player | null>(null);
  const [editing, setEditing] = useState(false);
  const [initialName, setInitialName] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const myCard = players.find((player) => player.name.toLowerCase() === sessionName.toLowerCase());

  function save(payload: PlayerPayload) {
    const onSuccess = () => {
      setEditing(false);
      setSelected(null);
      setInitialName("");
      // After creating a new card, attempt to register the push subscription now
      // that the player exists on the backend. If permission was already granted
      // (consumed by usePushAutoEnable on first load), this saves the subscription
      // silently without any browser dialog.
      if (!selected) {
        const PUSH_SAVED_KEY = "push_subscription_saved";
        if (localStorage.getItem(PUSH_SAVED_KEY) !== sessionName) {
          enablePushForUser(sessionName)
            .then((ok) => { if (ok) localStorage.setItem(PUSH_SAVED_KEY, sessionName); })
            .catch(() => undefined);
        }
      }
    };
    if (selected) {
      actions.update.mutate({ id: selected.id, payload }, { onSuccess });
    } else {
      actions.create.mutate(payload, { onSuccess });
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-pitch-400">Squad</p>
          <h1 className="font-display text-3xl font-bold">Players</h1>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => { setSelected(null); setInitialName(""); setEditing(true); }}>Add Player</Button>
      </div>
      {!myCard && sessionName ? (
        <Notice>
          Your session name is not a player card yet. Create your card to add skill, position, and attributes.
        </Notice>
      ) : null}
      {!myCard && sessionName ? (
        <Button variant="secondary" onClick={() => { setSelected(null); setInitialName(sessionName); setEditing(true); }}>
          Create My Card
        </Button>
      ) : null}
      {isLoading ? <EmptyState title="Loading players" /> : null}
      {!isLoading && players.length === 0 ? <EmptyState title="No players yet" detail="Add cards for the regular group, including your own." /> : null}
      {deleteError ? <Notice tone="error">{deleteError}</Notice> : null}
      <PlayerGrid players={players} onSelect={(player) => { setSelected(player); setEditing(true); setDeleteError(null); }} />
      <PlayerEditModal
        busy={actions.create.isPending || actions.update.isPending || actions.remove.isPending}
        open={editing}
        player={selected}
        initialName={initialName}
        onClose={() => { setEditing(false); setSelected(null); setInitialName(""); setDeleteError(null); }}
        onDelete={selected ? () => actions.remove.mutate(selected.id, {
          onSuccess: () => { setEditing(false); setDeleteError(null); },
          onError: (err) => setDeleteError(errorMessage(err, "Could not delete player. They may be registered for an upcoming event.")),
        }) : undefined}
        onSave={save}
      />
    </div>
  );
}
