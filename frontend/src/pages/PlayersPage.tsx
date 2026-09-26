import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { PlayerEditModal } from "../components/features/players/PlayerEditModal";
import { PlayerGrid } from "../components/features/players/PlayerGrid";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { PlayerGridSkeleton } from "../components/ui/Skeleton";
import { usePlayerActions, usePlayers } from "../hooks/usePlayers";
import { useSession } from "../hooks/useSession";
import { isEditorSession } from "../lib/roles";
import type { Player, PlayerPayload } from "../types/player.types";

export function PlayersPage() {
  const { data: players = [], isLoading } = usePlayers();
  const { sessionName } = useSession();
  const actions = usePlayerActions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<Player | null>(null);
  const [editing, setEditing] = useState(false);
  const [initialName, setInitialName] = useState("");
  const myCard = players.find((player) => player.name.toLowerCase() === sessionName.toLowerCase());
  const isEditor = isEditorSession(sessionName);
  // A new member with no card can create their own so they can enrol in events.
  // After saving it's editor-only (backend), so they set their values once.
  const canSelfCreate = Boolean(sessionName) && !isLoading && !myCard;

  function openMyCard() {
    setSelected(null);
    setInitialName(sessionName);
    setEditing(true);
  }

  // The You tab links here with ?create=me when you have no card yet.
  useEffect(() => {
    if (searchParams.get("create") === "me" && canSelfCreate) {
      openMyCard();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, canSelfCreate]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader
        title="Players"
        action={
          isEditor ? (
            <Button icon={<Plus size={18} />} onClick={() => { setSelected(null); setInitialName(""); setEditing(true); }}>
              Add
            </Button>
          ) : undefined
        }
      />

      {canSelfCreate ? (
        <section className="field-inverse -mx-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4">
          <div className="min-w-0">
            <p className="t-title text-[1.5rem]">You don&rsquo;t have a card yet</p>
            <p className="mt-1 text-[15px] text-ground/85">
              You need one to join matches. Once saved, only the rating keeper can change it.
            </p>
          </div>
          <Button onClick={openMyCard} variant="inverse">
            Create my card
          </Button>
        </section>
      ) : !isEditor && myCard ? (
        <p className="text-[15px] text-fg/75">Cards are kept by the squad&rsquo;s rating keeper. Tap one to see it in full.</p>
      ) : null}

      {isLoading ? <PlayerGridSkeleton /> : null}
      {!isLoading && players.length === 0 ? (
        <EmptyState detail="Add cards for the regular group, including your own." title="No players yet" />
      ) : null}
      <PlayerGrid myName={sessionName} players={players} onSelect={(player) => { setSelected(player); setEditing(true); }} />
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
