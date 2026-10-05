import { formationsFor } from "./formations";

interface FormationPickerProps {
  playersPerSide: number;
  value: string;
  readOnly?: boolean;
  onChange: (formation: string) => void;
}

export function FormationPicker({ playersPerSide, value, readOnly, onChange }: FormationPickerProps) {
  return (
    <div className="flex flex-wrap" role="radiogroup" aria-label="Formation">
      {formationsFor(playersPerSide).map((formation) => (
        <button
          aria-checked={value === formation}
          role="radio"
          className={`tap-target -ml-[2px] border-2 border-fg px-3 text-[14px] font-bold tabular-nums first:ml-0 disabled:cursor-default ${value === formation ? "bg-fg text-ground" : "text-fg hover:bg-fg/[0.07]"}`}
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
