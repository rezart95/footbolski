import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Camera, Save, Trash2 } from "lucide-react";
import { AttributeTag } from "./AttributeTag";
import { Button } from "../../ui/Button";
import { Field, Input } from "../../ui/Field";
import { Modal } from "../../ui/Modal";
import { uploadPlayerPhoto } from "../../../services/players.service";
import { colorFromName, initials } from "../../../lib/utils";
import type { Player, PlayerAttribute, PlayerPosition } from "../../../types/player.types";

const attributes: PlayerAttribute[] = ["fast", "technical", "physical", "leader", "aerial", "creative", "defensive", "clinical"];
const positions: PlayerPosition[] = ["GK", "DEF", "MID", "ATT"];

interface PlayerEditModalProps {
  player?: Player | null;
  initialName?: string;
  open: boolean;
  onClose: () => void;
  onSave: (payload: Omit<Player, "id">) => void;
  onDelete?: () => void;
  busy?: boolean;
}

const blank = {
  name: "", photo_url: null, skill_rating: 5, primary_position: "MID" as PlayerPosition, attributes: [],
  age: null as number | null,
  height_cm: null as number | null,
  build: null as string | null,
  preferred_role: null as string | null,
  speed: null as number | null,
  technique: null as number | null,
  defending: null as number | null,
  shooting: null as number | null,
  aerial: null as number | null,
  stamina: null as number | null,
  work_rate: null as number | null,
};

export function PlayerEditModal({ player, initialName = "", open, onClose, onSave, onDelete, busy }: PlayerEditModalProps) {
  const [form, setForm] = useState<Omit<Player, "id">>(blank);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(player ? { ...player } : { ...blank, name: initialName });
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

  function toggleAttribute(attribute: PlayerAttribute) {
    setForm((current) => {
      const exists = current.attributes.includes(attribute);
      const next = exists ? current.attributes.filter((item) => item !== attribute) : [...current.attributes, attribute].slice(0, 4);
      return { ...current, attributes: next };
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (form.name.trim()) {
      onSave({ ...form, name: form.name.trim() });
    }
  }

  return (
    <Modal title={player ? "Edit Player" : "Add Player"} open={open} onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>
        {/* Photo upload */}
        <div className="flex justify-center">
          <button
            className="group relative h-24 w-24 overflow-hidden rounded-full focus:outline-none"
            disabled={uploading}
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
            <div className="absolute inset-0 flex items-center justify-center bg-pitch-950/60 opacity-0 transition group-hover:opacity-100">
              {uploading ? (
                <span className="text-xs font-bold text-white">Uploading…</span>
              ) : (
                <Camera size={22} className="text-white" />
              )}
            </div>
          </button>
          <input accept="image/*" className="hidden" ref={fileRef} type="file" onChange={handlePhoto} />
        </div>
        <Field label="Name">
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
        <Field label={`Skill ${form.skill_rating}/10`}>
          <Input min={1} max={10} type="range" value={form.skill_rating} onChange={(event) => setForm({ ...form, skill_rating: Number(event.target.value) })} />
        </Field>
        <div className="grid grid-cols-4 gap-2">
          {positions.map((position) => (
            <Button key={position} onClick={() => setForm({ ...form, primary_position: position })} type="button" variant={form.primary_position === position ? "primary" : "secondary"}>
              {position}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {attributes.map((attribute) => (
            <AttributeTag attribute={attribute} active={form.attributes.includes(attribute)} key={attribute} onClick={() => toggleAttribute(attribute)} />
          ))}
        </div>
        {/* Physical info */}
        <p className="text-xs font-bold uppercase text-white/40">Physical</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age">
            <Input
              max={70} min={14} placeholder="–" type="number"
              value={form.age ?? ""}
              onChange={(e) => setForm({ ...form, age: e.target.value ? Number(e.target.value) : null })}
            />
          </Field>
          <Field label="Height (cm)">
            <Input
              max={220} min={140} placeholder="–" type="number"
              value={form.height_cm ?? ""}
              onChange={(e) => setForm({ ...form, height_cm: e.target.value ? Number(e.target.value) : null })}
            />
          </Field>
        </div>
        <Field label="Build">
          <Input
            placeholder="e.g. athletic, strong…"
            value={form.build ?? ""}
            onChange={(e) => setForm({ ...form, build: e.target.value || null })}
          />
        </Field>
        <Field label="Preferred role">
          <Input
            placeholder="e.g. Midfield / attack"
            value={form.preferred_role ?? ""}
            onChange={(e) => setForm({ ...form, preferred_role: e.target.value || null })}
          />
        </Field>

        {/* Attribute ratings */}
        <p className="text-xs font-bold uppercase text-white/40">Ratings</p>
        <Field label={`Speed ${form.speed ?? "–"}/10`}>
          <Input min={1} max={10} type="range" value={form.speed ?? 5} onChange={(e) => setForm({ ...form, speed: Number(e.target.value) })} />
        </Field>
        <Field label={`Technique ${form.technique ?? "–"}/10`}>
          <Input min={1} max={10} type="range" value={form.technique ?? 5} onChange={(e) => setForm({ ...form, technique: Number(e.target.value) })} />
        </Field>
        <Field label={`Defending ${form.defending ?? "–"}/10`}>
          <Input min={1} max={10} type="range" value={form.defending ?? 5} onChange={(e) => setForm({ ...form, defending: Number(e.target.value) })} />
        </Field>
        <Field label={`Shooting ${form.shooting ?? "–"}/10`}>
          <Input min={1} max={10} type="range" value={form.shooting ?? 5} onChange={(e) => setForm({ ...form, shooting: Number(e.target.value) })} />
        </Field>
        <Field label={`Aerial ${form.aerial ?? "–"}/10`}>
          <Input min={1} max={10} type="range" value={form.aerial ?? 5} onChange={(e) => setForm({ ...form, aerial: Number(e.target.value) })} />
        </Field>
        <Field label={`Stamina ${form.stamina ?? "–"}/10`}>
          <Input min={1} max={10} type="range" value={form.stamina ?? 5} onChange={(e) => setForm({ ...form, stamina: Number(e.target.value) })} />
        </Field>
        <Field label={`Work rate ${form.work_rate ?? "–"}/10`}>
          <Input min={1} max={10} type="range" value={form.work_rate ?? 5} onChange={(e) => setForm({ ...form, work_rate: Number(e.target.value) })} />
        </Field>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button disabled={busy} icon={<Save size={18} />} type="submit">Save</Button>
          {player && onDelete ? <Button disabled={busy} icon={<Trash2 size={18} />} onClick={onDelete} type="button" variant="danger" /> : null}
        </div>
      </form>
    </Modal>
  );
}
