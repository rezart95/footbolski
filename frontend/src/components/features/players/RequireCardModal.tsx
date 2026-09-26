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
    <Modal title="Player card needed" open={open} onClose={onClose}>
      <div className="grid gap-4">
        <p className="text-[17px] leading-relaxed text-fg/85">
          You need a <span className="font-bold text-fg">player card</span> before joining a match. It tells the
          team split your position, skill and build, so the sides come out fair.
        </p>
        <p className="text-[15px] text-fg/75">
          On the <span className="font-semibold text-fg">Players</span> tab, tap{" "}
          <span className="font-semibold text-fg">Create my card</span> and fill in your details.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            icon={<IdCard size={18} />}
            onClick={() => { onClose(); navigate("/players"); }}
          >
            Create my card
          </Button>
          <Button variant="secondary" onClick={onClose}>Not now</Button>
        </div>
      </div>
    </Modal>
  );
}
