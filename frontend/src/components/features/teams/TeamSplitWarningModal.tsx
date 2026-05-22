import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";

interface TeamSplitWarningModalProps {
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function TeamSplitWarningModal({ open, busy, onCancel, onConfirm }: TeamSplitWarningModalProps) {
  return (
    <Modal title="Generate Teams?" open={open} onClose={onCancel}>
      <div className="grid gap-5">
        <p className="text-white/70">Teams are generated once and cannot be changed or re-run. Are you sure?</p>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onCancel} variant="secondary">Cancel</Button>
          <Button disabled={busy} onClick={onConfirm}>Generate</Button>
        </div>
      </div>
    </Modal>
  );
}
