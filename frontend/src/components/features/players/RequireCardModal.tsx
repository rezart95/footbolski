import { useNavigate } from "react-router-dom";
import { IdCard } from "lucide-react";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";

interface RequireCardModalProps {
  open: boolean;
  onClose: () => void;
}

export function RequireCardModal({ open, onClose }: RequireCardModalProps) {
  const navigate = useNavigate();

  return (
    <Modal title="Player card required" open={open} onClose={onClose}>
      <div className="grid gap-4">
        <div className="flex items-start gap-3 rounded-lg border border-pitch-400/20 bg-pitch-400/5 p-4">
          <IdCard className="mt-0.5 shrink-0 text-pitch-400" size={20} />
          <p className="text-sm text-white/75">
            You need a <span className="font-bold text-white">player card</span> before joining an event. This gives the AI the information it needs to split teams fairly — position, skill, and physical stats.
          </p>
        </div>
        <p className="text-sm text-white/55">
          Go to the <span className="font-semibold text-white">Players</span> tab, tap <span className="font-semibold text-white">Create My Card</span>, and fill in your details. It only takes a minute.
        </p>
        <div className="flex gap-3">
          <Button
            icon={<IdCard size={18} />}
            onClick={() => { onClose(); navigate("/players"); }}
          >
            Create My Card
          </Button>
          <Button variant="secondary" onClick={onClose}>Not now</Button>
        </div>
      </div>
    </Modal>
  );
}
