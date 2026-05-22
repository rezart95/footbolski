import { useState } from "react";
import { Plus } from "lucide-react";
import { PlayerEditModal } from "../components/features/players/PlayerEditModal";
import { PlayerGrid } from "../components/features/players/PlayerGrid";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Notice } from "../components/ui/Notice";
import { usePlayerActions, usePlayers } from "../hooks/usePlayers";
import { useSession } from "../hooks/useSession";
import type { Player, PlayerPayload } from "../types/player.types";

export function PlayersPage() {
  const { data: players = [], isLoading } = usePlayers();
  const { sessionName } = useSession();
  const actions = usePlayerActions();
  const [selected, setSelected] = useState<Player | null>(null);
  const [editing, setEditing] = useState(false);
  const [initialName, setInitialName] = useState("");
  const myCard = players.find((player) => player.name.toLowerCase() === sessionName.toLowerCase());

  function save(payload: PlayerPayload) {
    const onSuccess = () => {
      setEditing(false);
      setSelected(null);
      setInitialName("");
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
      <PlayerGrid players={players} onSelect={(player) => { setSelected(player); setEditing(true); }} />
      <PlayerEditModal
        busy={actions.create.isPending || actions.update.isPending || actions.remove.isPending}
        open={editing}
        player={selected}
        initialName={initialName}
        onClose={() => { setEditing(false); setSelected(null); setInitialName(""); }}
        onDelete={selected ? () => actions.remove.mutate(selected.id, { onSuccess: () => setEditing(false) }) : undefined}
        onSave={save}
      />
    </div>
  );
}
