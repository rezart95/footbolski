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
  /** undefined while the contact-detail query is still loading. */
  phoneNumber: string | null | undefined;
  savingPhone: boolean;
  onSavePhone: (phoneNumber: string | null) => void;
  onDelete: () => void;
}

/** One squad member in the admin portal: identity, editable scouting notes,
 * a phone-number field, and delete. Phone behaves exactly like notes — the
 * admin portal is the one place in the app trusted with the actual digits
 * (see `PlayerContactDetail`), so the field is pre-filled when a number is
 * on file and genuinely empty only when one isn't. */
export function AdminPlayerRow({
  player,
  savingNotes,
  onSaveNotes,
  phoneNumber,
  savingPhone,
  onSavePhone,
  onDelete
}: AdminPlayerRowProps) {
  const stored = player.notes ?? "";
  const [notes, setNotes] = useState(stored);
  const storedPhone = phoneNumber ?? "";
  const [phone, setPhone] = useState(storedPhone);

  // Re-sync when a save resolves and the query refetches, or when switching
  // between filtered lists, so the fields reflect the server's value.
  useEffect(() => setNotes(stored), [stored]);
  useEffect(() => setPhone(storedPhone), [storedPhone]);

  const dirty = notes !== stored;
  const phoneDirty = phone !== storedPhone;

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
        <div className="flex items-center gap-2 text-xs font-semibold text-white/50">
          <Phone size={14} />
          Phone number
        </div>
        <Input
          inputMode="tel"
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+48501234567"
          type="tel"
          value={phone}
        />
        {phoneDirty ? (
          <div className="flex items-center gap-2">
            <Button
              className="px-3 py-2 text-xs"
              disabled={savingPhone}
              icon={<Check size={15} />}
              onClick={() => onSavePhone(phone.trim() ? phone.trim() : null)}
            >
              {savingPhone ? "Saving…" : "Save phone"}
            </Button>
            <button className="text-xs font-semibold text-white/50 hover:text-white/80" onClick={() => setPhone(storedPhone)} type="button">
              Cancel
            </button>
          </div>
        ) : null}
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
