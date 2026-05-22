import { FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useSession } from "../../../hooks/useSession";
import { Button } from "../../ui/Button";
import { Field, Input } from "../../ui/Field";
import { Modal } from "../../ui/Modal";

interface NameEntryModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function NameEntryModal({ forceOpen = false, onClose }: NameEntryModalProps) {
  const { sessionName, setSessionName, isSessionSet } = useSession();
  const [name, setName] = useState(sessionName);
  const open = forceOpen || !isSessionSet;

  useEffect(() => {
    if (open) {
      setName(sessionName);
    }
  }, [open, sessionName]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setSessionName(trimmed);
    onClose?.();
  }

  return (
    <Modal title="What's your name?" open={open} onClose={forceOpen ? onClose : undefined}>
      <form className="grid gap-4" onSubmit={submit}>
        <Field label="Session name">
          <Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" />
        </Field>
        <Button icon={<Save size={18} />} type="submit">
          Save Name
        </Button>
      </form>
    </Modal>
  );
}
