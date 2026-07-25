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
  // A new member with no card can create their own so they can enrol in events.
  // After saving it's editor-only (backend), so they set their values once.
  const canSelfCreate = Boolean(sessionName) && !myCard;

  function openMyCard() {
    setSelected(null);
    setInitialName(sessionName);
    setEditing(true);
  }

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
      {canSelfCreate ? (
        <Notice>
          You don't have a player card yet. Create yours to set your attributes and join events — once saved, only the squad's rating keeper can change it.
        </Notice>
      ) : null}
      {canSelfCreate ? (
        <Button variant="secondary" onClick={openMyCard}>Create My Card</Button>
      ) : null}
      {!isEditor && myCard ? (
        <Notice>Player cards are read-only for the moment.</Notice>
      ) : null}
      {isLoading ? <PlayerGridSkeleton /> : null}
      {!isLoading && players.length === 0 ? <EmptyState title="No players yet" detail="Add cards for the regular group, including your own." /> : null}
      <PlayerGrid players={players} onSelect={(player) => { setSelected(player); setEditing(true); }} />
      <PlayerEditModal
        busy={actions.create.isPending || actions.update.isPending}
        open={editing}
        player={selected}
        initialName={initialName}
        readOnly={!isEditor && selected !== null}
        lockName={!isEditor}
        onClose={() => { setEditing(false); setSelected(null); setInitialName(""); }}
        onSave={save}
      />
    </div>
  );
}
