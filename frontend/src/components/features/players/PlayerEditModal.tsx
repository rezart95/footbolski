import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Camera, Save } from "lucide-react";
import { Button } from "../../ui/Button";
import { Field, Input, Range, Select } from "../../ui/Field";
import { Notice } from "../../ui/Notice";
import { Modal } from "../../ui/Modal";
import { uploadPlayerPhoto } from "../../../services/players.service";
import { initials } from "../../../lib/utils";
import type { Player, PlayerPosition } from "../../../types/player.types";

const BUILD_OPTIONS = ["Slim", "Athletic", "Strong", "Stocky"] as const;
const ROLE_OPTIONS = [
  "Goalkeeper",
  "Centre Back",
  "Full Back (Right)",
  "Full Back (Left)",
  "Defensive Mid",
  "Box-to-Box Mid",
  "Attacking Mid / No.10",
  "Winger",
  "Striker / Forward",
  "Flexible",
] as const;

function roleToPrimaryPosition(role: string | null): PlayerPosition {
  if (!role) return "MID";
  if (role === "Goalkeeper") return "GK";
  if (role.startsWith("Centre Back") || role.startsWith("Full Back")) return "DEF";
  if (role === "Striker / Forward") return "ATT";
  if (role === "Winger") return "ATT";
  if (role === "Attacking Mid / No.10") return "ATT";
  return "MID";
}

interface PlayerEditModalProps {
  player?: Player | null;
  initialName?: string;
  open: boolean;
  onClose: () => void;
  onSave: (payload: Omit<Player, "id">) => void;
  busy?: boolean;
  /** View-only: every field disabled, no Save button. Used for everyone
   * except the one player who maintains the squad's ratings. */
  readOnly?: boolean;
  /** Lock just the name field while the rest stays editable — for a new member
   * self-creating their own card, whose name must match their session name. */
  lockName?: boolean;
}

const blank = {
  name: "", photo_url: null, skill_rating: 5, primary_position: "MID" as PlayerPosition,
  age: null as number | null,
  height_cm: null as number | null,
  build: null as string | null,
  preferred_role: null as string | null,
  speed: 5,
  technique: 5,
  defending: 5,
  shooting: 5,
  aerial: 5,
  passing: 5,
  stamina: 5,
  work_rate: 5,
};

export function PlayerEditModal({ player, initialName = "", open, onClose, onSave, busy, readOnly = false, lockName = false }: PlayerEditModalProps) {
  const [form, setForm] = useState<Omit<Player, "id">>(blank);
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(player ? { ...player } : { ...blank, name: initialName });
    setValidationError(null);
  }, [initialName, player, open]);

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadPlayerPhoto(file);
      setForm((f) => ({ ...f, photo_url: url }));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    if (!form.photo_url) { setValidationError("Please upload a photo."); return; }
    if (!form.age) { setValidationError("Age is required."); return; }
    if (!form.height_cm) { setValidationError("Height is required."); return; }
    if (!form.build) { setValidationError("Build is required."); return; }
    if (!form.preferred_role) { setValidationError("Primary role is required."); return; }
    setValidationError(null);
    onSave({ ...form, name: form.name.trim() });
  }

  return (
    <Modal title={player ? player.name : "New player card"} open={open} onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>
        {readOnly ? (
          <p className="text-[15px] text-fg/75">Only the squad&rsquo;s rating keeper can change cards.</p>
        ) : null}
        {/* Photo upload */}
        <div className="flex flex-col items-start">
          <button
            aria-label={readOnly ? undefined : form.photo_url ? "Change photo" : "Add a photo"}
            className="group relative h-32 w-32 overflow-hidden border-2 border-fg bg-fg/10"
            disabled={uploading || readOnly}
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            {form.photo_url ? (
              <img alt="" className="h-full w-full object-cover" src={form.photo_url} />
            ) : (
              <div className="t-numeral grid h-full w-full place-items-center text-[2.5rem]">
                {initials(form.name || "?")}
              </div>
            )}
            {readOnly ? null : (
              <div className="field-inverse absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 py-1 text-[13px] font-bold">
                {uploading ? "Uploading…" : <><Camera size={15} /> {form.photo_url ? "Change" : "Add photo"}</>}
              </div>
            )}
          </button>
          <input accept="image/*" className="hidden" ref={fileRef} type="file" onChange={handlePhoto} />
          {!form.photo_url && !readOnly && <p className="mt-1.5 text-[14px] font-semibold">A photo is required.</p>}
        </div>
        <Field label="Name">
          <Input disabled={readOnly || lockName} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
        <Field label={`Skill ${form.skill_rating}/10`}>
          <Range disabled={readOnly} min={1} max={10} value={form.skill_rating} onChange={(event) => setForm({ ...form, skill_rating: Number(event.target.value) })} />
        </Field>
        {/* Physical info */}
        <h3 className="t-title mt-2 border-t-2 border-fg pt-4 text-[1.35rem]">Build</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age *">
            <Input
              disabled={readOnly}
              max={70} min={14} placeholder="–" required type="number"
              value={form.age ?? ""}
              onChange={(e) => setForm({ ...form, age: e.target.value ? Number(e.target.value) : null })}
            />
          </Field>
          <Field label="Height (cm) *">
            <Input
              disabled={readOnly}
              max={220} min={140} placeholder="–" required type="number"
              value={form.height_cm ?? ""}
              onChange={(e) => setForm({ ...form, height_cm: e.target.value ? Number(e.target.value) : null })}
            />
          </Field>
        </div>
        <Field label="Build *">
          <Select
            disabled={readOnly}
            value={form.build ?? ""}
            onChange={(e) => setForm({ ...form, build: e.target.value || null })}
          >
            <option value="">Choose…</option>
            {BUILD_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
        </Field>
        <Field label="Primary role *">
          <Select
            disabled={readOnly}
            value={form.preferred_role ?? ""}
            onChange={(e) => setForm({ ...form, preferred_role: e.target.value || null, primary_position: roleToPrimaryPosition(e.target.value || null) })}
          >
            <option value="">Choose…</option>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>

        {/* Attribute ratings */}
        <h3 className="t-title mt-2 border-t-2 border-fg pt-4 text-[1.35rem]">Ratings</h3>
        <Field label={`Speed ${form.speed ?? "–"}/10`}>
          <Range disabled={readOnly} min={1} max={10} value={form.speed ?? 5} onChange={(e) => setForm({ ...form, speed: Number(e.target.value) })} />
        </Field>
        <Field label={`Technique ${form.technique ?? "–"}/10`}>
          <Range disabled={readOnly} min={1} max={10} value={form.technique ?? 5} onChange={(e) => setForm({ ...form, technique: Number(e.target.value) })} />
        </Field>
        <Field label={`Defending ${form.defending ?? "–"}/10`}>
          <Range disabled={readOnly} min={1} max={10} value={form.defending ?? 5} onChange={(e) => setForm({ ...form, defending: Number(e.target.value) })} />
        </Field>
        <Field label={`Passing ${form.passing ?? "–"}/10`}>
          <Range disabled={readOnly} min={1} max={10} value={form.passing ?? 5} onChange={(e) => setForm({ ...form, passing: Number(e.target.value) })} />
        </Field>
        <Field label={`Shooting ${form.shooting ?? "–"}/10`}>
          <Range disabled={readOnly} min={1} max={10} value={form.shooting ?? 5} onChange={(e) => setForm({ ...form, shooting: Number(e.target.value) })} />
        </Field>
        <Field label={`Aerial ${form.aerial ?? "–"}/10`}>
          <Range disabled={readOnly} min={1} max={10} value={form.aerial ?? 5} onChange={(e) => setForm({ ...form, aerial: Number(e.target.value) })} />
        </Field>
        <Field label={`Stamina ${form.stamina ?? "–"}/10`}>
          <Range disabled={readOnly} min={1} max={10} value={form.stamina ?? 5} onChange={(e) => setForm({ ...form, stamina: Number(e.target.value) })} />
        </Field>
        <Field label={`Work rate ${form.work_rate ?? "–"}/10`}>
          <Range disabled={readOnly} min={1} max={10} value={form.work_rate ?? 5} onChange={(e) => setForm({ ...form, work_rate: Number(e.target.value) })} />
        </Field>

        {validationError ? (
          <Notice tone="error">{validationError}</Notice>
        ) : null}
        {readOnly ? null : (
          <Button disabled={busy || uploading} icon={<Save size={18} />} type="submit">{busy ? "Saving…" : "Save card"}</Button>
        )}
      </form>
    </Modal>
  );
}