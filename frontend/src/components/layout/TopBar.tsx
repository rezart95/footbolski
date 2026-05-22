import { Settings } from "lucide-react";
import { Button } from "../ui/Button";
import { useSession } from "../../hooks/useSession";

interface TopBarProps {
  onEditName: () => void;
}

export function TopBar({ onEditName }: TopBarProps) {
  const { sessionName } = useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-pitch-950/90 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div>
          <p className="font-display text-2xl font-bold leading-none">Pitchup</p>
          <p className="mt-1 max-w-48 truncate text-xs text-white/55">{sessionName || "No name set"}</p>
        </div>
        <Button aria-label="Edit name" icon={<Settings size={18} />} onClick={onEditName} variant="secondary" />
      </div>
    </header>
  );
}
