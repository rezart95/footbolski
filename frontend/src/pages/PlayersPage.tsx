import { useState } from "react";
import { Plus } from "lucide-react";
import { PlayerEditModal } from "../components/features/players/PlayerEditModal";
import { PlayerGrid } from "../components/features/players/PlayerGrid";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { usePlayerActions, usePlayers } from "../hooks/usePlayers";
import type { Player, PlayerPayload } from "../types/player.types";

export function PlayersPage() {
  const { data: players = [], isLoading } = usePlayers();
  const actions = usePlayerActions();
  const [selected, setSelected] = useState<Player | null>(null);
  const [editing, setEditing] = useState(false);

  function save(payload: PlayerPayload) {
    const onSuccess = () => {
      setEditing(false);
      setSelected(null);
    };
    if (selected) {
      actions.update.mutate({ id: selected.id, payload }, { onSuccess });
    } else {
      actions.create.mutate(payload, { onSuccess });
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Players</h1>
        <Button icon={<Plus size={18} />} onClick={() => setEditing(true)}>Add</Button>
      </div>
      {isLoading ? <EmptyState title="Loading players" /> : null}
      {!isLoading && players.length === 0 ? <EmptyState title="No players yet" detail="Add cards for the regular group." /> : null}
      <PlayerGrid players={players} onSelect={(player) => { setSelected(player); setEditing(true); }} />
      <PlayerEditModal
        busy={actions.create.isPending || actions.update.isPending || actions.remove.isPending}
        open={editing}
        player={selected}
        onClose={() => { setEditing(false); setSelected(null); }}
        onDelete={selected ? () => actions.remove.mutate(selected.id, { onSuccess: () => setEditing(false) }) : undefined}
        onSave={save}
      />
    </div>
  );
}
