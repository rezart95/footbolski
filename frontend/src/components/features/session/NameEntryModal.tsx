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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const open = forceOpen || !isSessionSet;

  useEffect(() => {
    if (open) {
      const parts = sessionName.trim().split(" ");
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" ") ?? "");
    }
  }, [open, sessionName]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first || !last) return;
    setSessionName(`${first} ${last}`);
    onClose?.();
  }

  return (
    <Modal title="What's your name?" open={open} onClose={forceOpen ? onClose : undefined}>
      <form className="grid gap-4" onSubmit={submit}>
        <p className="text-sm text-white/55">Use your real first and last name — this is how you'll appear in events and team splits.</p>
        <Field label="First name">
          <Input
            autoFocus
            placeholder="e.g. Robert"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </Field>
        <Field label="Last name">
          <Input
            placeholder="e.g. Lewandowski"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </Field>
        <Button disabled={!firstName.trim() || !lastName.trim()} icon={<Save size={18} />} type="submit">
          Save Name
        </Button>
      </form>
    </Modal>
  );
}
