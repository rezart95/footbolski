import { useEffect, useState } from "react";
import { Check, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "../../ui/Button";
import { Field, Input, Textarea } from "../../ui/Field";
import { PlayerPhoto } from "../players/PlayerCard";
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

/** One squad member in the admin portal. Closed, it is a scannable line:
 * photo, name, phone, whether notes exist. Opened, it holds the phone and
 * scouting-notes fields and the remove action. Phone behaves exactly like
 * notes — the admin portal is the one place in the app trusted with the actual
 * digits (see `PlayerContactDetail`), so the field is pre-filled when a number
 * is on file and genuinely empty only when one isn't. */
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
    <li className="border-b border-fg/25">
      <details className="group">
        <summary className="flex min-h-[4.25rem] cursor-pointer list-none items-center gap-3 py-2 hover:bg-fg/[0.04] [&::-webkit-details-marker]:hidden">
          <PlayerPhoto className="w-12 shrink-0 [&_div]:text-[1.1rem]" player={player} />
          <span className="min-w-0 flex-1">
            <span className="block break-words text-[16px] font-bold leading-tight">{player.name}</span>
            <span className="block text-[14px] tabular-nums text-fg/75">
              {phoneNumber === undefined ? "…" : storedPhone || "No phone on file"}
              {stored ? " · has notes" : ""}
            </span>
          </span>
          <ChevronDown className="shrink-0 transition-transform duration-200 group-open:rotate-180" size={20} />
        </summary>

        <div className="grid gap-3 pb-5 pt-2">
          <Field label="Phone number">
            <Input
              inputMode="tel"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+48 501 234 567"
              type="tel"
              value={phone}
            />
          </Field>
          {phoneDirty ? (
            <div className="flex items-center gap-2">
              <Button
                disabled={savingPhone}
                icon={<Check size={16} />}
                onClick={() => onSavePhone(phone.trim() ? phone.trim() : null)}
              >
                {savingPhone ? "Saving…" : "Save phone"}
              </Button>
              <Button onClick={() => setPhone(storedPhone)} variant="ghost">
                Undo
              </Button>
            </div>
          ) : null}

          <Field label="Scouting notes">
            <Textarea placeholder="How they play, who they combine well with…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          {dirty ? (
            <div className="flex items-center gap-2">
              <Button disabled={savingNotes} icon={<Check size={16} />} onClick={() => onSaveNotes(notes.trim() ? notes : null)}>
                {savingNotes ? "Saving…" : "Save notes"}
              </Button>
              <Button onClick={() => setNotes(stored)} variant="ghost">
                Undo
              </Button>
            </div>
          ) : null}

          <div>
            <Button icon={<Trash2 size={17} />} onClick={onDelete} variant="danger">
              Remove card
            </Button>
          </div>
        </div>
      </details>
    </li>
  );
}
