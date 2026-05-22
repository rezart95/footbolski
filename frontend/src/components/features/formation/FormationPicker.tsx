import { formationsFor } from "./formations";

interface FormationPickerProps {
  playersPerSide: number;
  value: string;
  readOnly?: boolean;
  onChange: (formation: string) => void;
}

export function FormationPicker({ playersPerSide, value, readOnly, onChange }: FormationPickerProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {formationsFor(playersPerSide).map((formation) => (
        <button
          className={`tap-target min-w-20 rounded-lg px-3 font-mono text-sm font-black ${value === formation ? "bg-pitch-400 text-pitch-950" : "bg-white/10 text-white/70"}`}
          disabled={readOnly}
          key={formation}
          onClick={() => onChange(formation)}
          type="button"
        >
          {formation}
        </button>
      ))}
    </div>
  );
}
