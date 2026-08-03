import { useEffect, useState } from "react";
import { Check, Phone, Trash2 } from "lucide-react";
import { Button } from "../../ui/Button";
import { Input, Textarea } from "../../ui/Field";
import { colorFromName, initials } from "../../../lib/utils";
import type { Player } from "../../../types/player.types";

interface AdminPlayerRowProps {
  player: Player;
  savingNotes: boolean;
  onSaveNotes: (notes: string | null) => void;
  hasPhone: boolean | undefined;
  savingPhone: boolean;
  onSavePhone: (phoneNumber: string) => void;
  onDelete: () => void;
}

/** One squad member in the admin portal: identity, editable scouting notes,
 * a phone-number field, and delete. Notes and phone are the two things with
 * no home elsewhere in the app — the number itself is never sent to the
 * browser (see `PlayerContactStatus`), so the field always renders empty and
 * only ever *replaces* what's on file, whether or not something's there. */
export function AdminPlayerRow({
  player,
  savingNotes,
  onSaveNotes,
  hasPhone,
  savingPhone,
  onSavePhone,
  onDelete
}: AdminPlayerRowProps) {
  const stored = player.notes ?? "";
  const [notes, setNotes] = useState(stored);
  const [phone, setPhone] = useState("");

  // Re-sync when a save resolves and the query refetches, or when switching
  // between filtered lists, so the textarea reflects the server's value.
  useEffect(() => setNotes(stored), [stored]);

  const dirty = notes !== stored;
  const phoneDirty = phone.trim().length > 0;

  const savePhone = () => {
    if (!phoneDirty) return;
    onSavePhone(phone.trim());
    setPhone("");
  };

  return (
    <div className="surface flex flex-col gap-3 rounded-xl p-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 flex-none overflow-hidden rounded-full">
          {player.photo_url ? (
            <img alt="" className="h-full w-full object-cover" src={player.photo_url} />
          ) : (
            <div className={`flex h-full w-full items-center justify-center font-display text-sm font-bold text-pitch-950 ${colorFromName(player.name)}`}>
              {initials(player.name)}
            </div>
          )}
        </div>
        <p className="min-w-0 flex-1 truncate font-display text-base font-bold">{player.name}</p>
        <button
          aria-label={`Delete ${player.name}`}
          className="tap-target rounded-lg border border-red-300/15 bg-red-500/10 p-2.5 text-red-200 transition hover:bg-red-500/20"
          onClick={onDelete}
          type="button"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Phone className={hasPhone ? "text-pitch-400" : "text-white/35"} size={14} />
          <span className={hasPhone ? "text-white/70" : "text-white/40"}>
            {hasPhone === undefined ? "Checking…" : hasPhone ? "Phone on file" : "No phone number"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            className="flex-1"
            inputMode="tel"
            onChange={(e) => setPhone(e.target.value)}
            placeholder={hasPhone ? "Enter a new number to replace it…" : "+48501234567"}
            type="tel"
            value={phone}
          />
          {phoneDirty ? (
            <Button className="px-3 py-2 text-xs" disabled={savingPhone} icon={<Check size={15} />} onClick={savePhone}>
              {savingPhone ? "Saving…" : "Save"}
            </Button>
          ) : null}
        </div>
      </div>

      <Textarea
        placeholder="Add notes about this player…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {dirty ? (
        <div className="flex items-center gap-2">
          <Button className="px-3 py-2 text-xs" disabled={savingNotes} icon={<Check size={15} />} onClick={() => onSaveNotes(notes.trim() ? notes : null)}>
            {savingNotes ? "Saving…" : "Save notes"}
          </Button>
          <button className="text-xs font-semibold text-white/50 hover:text-white/80" onClick={() => setNotes(stored)} type="button">
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  );
}
