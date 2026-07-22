import { FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Link } from "react-router-dom";
import { useSession } from "../../../hooks/useSession";
import { useTermsAcceptance } from "../../../hooks/useTermsAcceptance";
import { TERMS_SUMMARY } from "../../../content/terms";
import { Button } from "../../ui/Button";
import { Checkbox, Field, Input } from "../../ui/Field";
import { Modal } from "../../ui/Modal";
import { Notice } from "../../ui/Notice";

interface NameEntryModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function NameEntryModal({ forceOpen = false, onClose }: NameEntryModalProps) {
  const { sessionName, setSessionName, isSessionSet } = useSession();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const { needsAcceptance, accept, isSaving, error } = useTermsAcceptance();

  // Terms are captured here because this is the one moment the app already stops
  // someone for their identity, and that name is what the consent record attaches
  // to. Existing users are re-prompted only when the terms version changes.
  const open = forceOpen || !isSessionSet || needsAcceptance;

  useEffect(() => {
    if (open) {
      const parts = sessionName.trim().split(" ");
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" ") ?? "");
    }
  }, [open, sessionName]);

  const nameComplete = Boolean(firstName.trim() && lastName.trim());
  const canSubmit = nameComplete && (!needsAcceptance || accepted) && !isSaving;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    // Record consent before storing the name. If the request fails the modal
    // stays open with an error rather than letting someone through with no
    // record, which would defeat the point of collecting it at all.
    if (needsAcceptance) {
      const saved = await accept(fullName);
      if (!saved) return;
    }
    setSessionName(fullName);
    onClose?.();
  }

  return (
    <Modal title="What's your name?" open={open} onClose={forceOpen ? onClose : undefined}>
      <form className="grid gap-4" onSubmit={submit}>
        <p className="text-sm text-white/55">
          Use your real first and last name — this is how you'll appear in events and team splits.
        </p>
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

        {needsAcceptance ? (
          <div className="grid gap-2 border-t border-white/10 pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-white/50">
              Terms and Conditions
            </p>
            <p className="text-sm leading-relaxed text-white/60">{TERMS_SUMMARY}</p>
            <Checkbox checked={accepted} onChange={(e) => setAccepted(e.target.checked)}>
              I have read and accept the{" "}
              <Link className="border-b border-pitch-400/60 text-pitch-400" target="_blank" to="/terms">
                Terms and Conditions
              </Link>
              .
            </Checkbox>
          </div>
        ) : null}

        {error ? <Notice tone="error">{error}</Notice> : null}

        <Button disabled={!canSubmit} icon={<Save size={18} />} type="submit">
          {isSaving ? "Saving…" : "Save Name"}
        </Button>
      </form>
    </Modal>
  );
}
