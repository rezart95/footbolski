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
    <Modal title="Split the teams?" open={open} onClose={onCancel}>
      <div className="grid gap-5">
        <p className="text-[17px] leading-relaxed text-fg/80">
          Teams are split once and can&rsquo;t be re-run. You can still move players on the pitch afterwards.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onCancel} variant="secondary">Not yet</Button>
          <Button disabled={busy} onClick={onConfirm}>Split teams</Button>
        </div>
      </div>
    </Modal>
  );
}
