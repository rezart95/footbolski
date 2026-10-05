import { Shuffle } from "lucide-react";
import { useState } from "react";
import { Button } from "../../ui/Button";
import { TeamSplitWarningModal } from "./TeamSplitWarningModal";

interface TeamSplitButtonProps {
  visible: boolean;
  busy?: boolean;
  onGenerate: () => void;
}

export function TeamSplitButton({ visible, busy, onGenerate }: TeamSplitButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (!visible) return null;

  return (
    <>
      <Button className="w-full" icon={<Shuffle size={18} />} onClick={() => setConfirming(true)}>
        Split the teams
      </Button>
      <TeamSplitWarningModal
        busy={busy}
        open={confirming}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onGenerate();
        }}
      />
    </>
  );
}
