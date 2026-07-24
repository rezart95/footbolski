import { useState } from "react";
import { Plus } from "lucide-react";
import { PlayerEditModal } from "../components/features/players/PlayerEditModal";
import { PlayerGrid } from "../components/features/players/PlayerGrid";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { PlayerGridSkeleton } from "../components/ui/Skeleton";
import { Notice } from "../components/ui/Notice";
import { usePlayerActions, usePlayers } from "../hooks/usePlayers";
import { useSession } from "../hooks/useSession";
import { isEditorSession } from "../lib/roles";
import type { Player, PlayerPayload } from "../types/player.types";

export function PlayersPage() {
  const { data: players = [], isLoading } = usePlayers();
  const { sessionName } = useSession();
  const actions = usePlayerActions();
  const [selected, setSelected] = useState<Player | null>(null);
  const [editing, setEditing] = useState(false);
  const [initialName, setInitialName] = useState("");
  const myCard = players.find((player) => player.name.toLowerCase() === sessionName.toLowerCase());
  const isEditor = isEditorSession(sessionName);

  function save(payload: PlayerPayload) {
    const onSuccess = () => {
      setEditing(false);
      setSelected(null);
      setInitialName("");
    };
    if (selected) {
      actions.update.mutate({ id: selected.id, payload, requestedBy: sessionName }, { onSuccess });
    } else {
      actions.create.mutate({ payload, requestedBy: sessionName }, { onSuccess });
    }
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        eyebrow="Squad"
        title="Players"
        action={
          isEditor ? (
            <Button className="px-3" icon={<Plus size={18} />} onClick={() => { setSelected(null); setInitialName(""); setEditing(true); }}>Add</Button>
          ) : undefined
        }
      />
      {!isEditor ? (
        <Notice>Player cards are read-only for the moment.</Notice>
      ) : null}
      {isEditor && !myCard && sessionName ? (
        <Notice>
          Your session name is not a player card yet. Create your card to add skill, position, and attributes.
        </Notice>
      ) : null}
      {isEditor && !myCard && sessionName ? (
        <Button variant="secondary" onClick={() => { setSelected(null); setInitialName(sessionName); setEditing(true); }}>
          Create My Card
        </Button>
      ) : null}
      {isLoading ? <PlayerGridSkeleton /> : null}
      {!isLoading && players.length === 0 ? <EmptyState title="No players yet" detail="Add cards for the regular group, including your own." /> : null}
      <PlayerGrid players={players} onSelect={(player) => { setSelected(player); setEditing(true); }} />
      <PlayerEditModal
        busy={actions.create.isPending || actions.update.isPending}
        open={editing}
        player={selected}
        initialName={initialName}
        readOnly={!isEditor}
        onClose={() => { setEditing(false); setSelected(null); setInitialName(""); }}
        onSave={save}
      />
    </div>
  );
}
