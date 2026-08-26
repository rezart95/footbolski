import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Camera, Save } from "lucide-react";
import { Button } from "../../ui/Button";
import { Field, Input, Select } from "../../ui/Field";
import { Modal } from "../../ui/Modal";
import { uploadPlayerPhoto } from "../../../services/players.service";
import { colorFromName, initials } from "../../../lib/utils";
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
    <Modal title={player ? "Edit Player" : "Add Player"} open={open} onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>
        {readOnly ? (
          <p className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/55">
            Player cards are read-only for the moment.
          </p>
        ) : null}
        {/* Photo upload */}
        <div className="flex justify-center">
          <button
            className="group relative h-24 w-24 overflow-hidden rounded-full focus:outline-none"
            disabled={uploading || readOnly}
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            {form.photo_url ? (
              <img alt="" className="h-full w-full object-cover" src={form.photo_url} />
            ) : (
              <div className={`flex h-full w-full items-center justify-center font-display text-3xl font-bold text-pitch-950 ${colorFromName(form.name || "?")}`}>
                {initials(form.name || "?")}
              </div>
            )}
            {readOnly ? null : (
              <div className="absolute inset-0 flex items-center justify-center bg-pitch-950/60 opacity-0 transition group-hover:opacity-100">
                {uploading ? (
                  <span className="text-xs font-bold text-white">Uploading…</span>
                ) : (
                  <Camera size={22} className="text-white" />
                )}
              </div>
            )}
          </button>
          <input accept="image/*" className="hidden" ref={fileRef} type="file" onChange={handlePhoto} />
          {!form.photo_url && !readOnly && <p className="mt-1 text-center text-xs text-amber-400">Photo required</p>}
        </div>
        <Field label="Name">
          <Input disabled={readOnly || lockName} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
        <Field label={`Skill ${form.skill_rating}/10`}>
          <Input disabled={readOnly} min={1} max={10} type="range" value={form.skill_rating} onChange={(event) => setForm({ ...form, skill_rating: Number(event.target.value) })} />
        </Field>
        {/* Physical info */}
        <p className="text-xs font-bold uppercase text-white/55">Physical</p>
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
            <option value="">— select —</option>
            {BUILD_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
        </Field>
        <Field label="Primary role *">
          <Select
            disabled={readOnly}
            value={form.preferred_role ?? ""}
            onChange={(e) => setForm({ ...form, preferred_role: e.target.value || null, primary_position: roleToPrimaryPosition(e.target.value || null) })}
          >
            <option value="">— select —</option>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>

        {/* Attribute ratings */}
        <p className="text-xs font-bold uppercase text-white/55">Ratings</p>
        <Field label={`Speed ${form.speed ?? "–"}/10`}>
          <Input disabled={readOnly} min={1} max={10} type="range" value={form.speed ?? 5} onChange={(e) => setForm({ ...form, speed: Number(e.target.value) })} />
        </Field>
        <Field label={`Technique ${form.technique ?? "–"}/10`}>
          <Input disabled={readOnly} min={1} max={10} type="range" value={form.technique ?? 5} onChange={(e) => setForm({ ...form, technique: Number(e.target.value) })} />
        </Field>
        <Field label={`Defending ${form.defending ?? "–"}/10`}>
          <Input disabled={readOnly} min={1} max={10} type="range" value={form.defending ?? 5} onChange={(e) => setForm({ ...form, defending: Number(e.target.value) })} />
        </Field>
        <Field label={`Passing ${form.passing ?? "–"}/10`}>
          <Input disabled={readOnly} min={1} max={10} type="range" value={form.passing ?? 5} onChange={(e) => setForm({ ...form, passing: Number(e.target.value) })} />
        </Field>
        <Field label={`Shooting ${form.shooting ?? "–"}/10`}>
          <Input disabled={readOnly} min={1} max={10} type="range" value={form.shooting ?? 5} onChange={(e) => setForm({ ...form, shooting: Number(e.target.value) })} />
        </Field>
        <Field label={`Aerial ${form.aerial ?? "–"}/10`}>
          <Input disabled={readOnly} min={1} max={10} type="range" value={form.aerial ?? 5} onChange={(e) => setForm({ ...form, aerial: Number(e.target.value) })} />
        </Field>
        <Field label={`Stamina ${form.stamina ?? "–"}/10`}>
          <Input disabled={readOnly} min={1} max={10} type="range" value={form.stamina ?? 5} onChange={(e) => setForm({ ...form, stamina: Number(e.target.value) })} />
        </Field>
        <Field label={`Work rate ${form.work_rate ?? "–"}/10`}>
          <Input disabled={readOnly} min={1} max={10} type="range" value={form.work_rate ?? 5} onChange={(e) => setForm({ ...form, work_rate: Number(e.target.value) })} />
        </Field>

        {validationError ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{validationError}</p>
        ) : null}
        {readOnly ? null : (
          <Button disabled={busy || uploading} icon={<Save size={18} />} type="submit">Save</Button>
        )}
      </form>
    </Modal>
  );
}