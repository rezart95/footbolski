import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { enablePushForUser } from "../../../lib/push";
import { useSession } from "../../../hooks/useSession";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";

const IS_DEV = import.meta.env.DEV;

const DISMISSED_KEY = "push_prompt_dismissed";
const REMIND_AFTER_DAYS = 1; // re-show modal if still not decided after this many days

function getPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

function shouldShowModal(): boolean {
  const raw = localStorage.getItem(DISMISSED_KEY);
  if (!raw) return true; // never dismissed → show
  const dismissedAt = Number(raw);
  if (isNaN(dismissedAt)) return false; // permanently dismissed (old flag format)
  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return daysSince >= REMIND_AFTER_DAYS;
}

export function PushPrompt() {
  const { sessionName, isSessionSet } = useSession();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(getPermission);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show first-visit modal once session is set and push is not yet decided
  useEffect(() => {
    if (!isSessionSet) return;
    if (permission !== "default") return;
    if (!shouldShowModal()) return;
    const t = setTimeout(() => setShowModal(true), 1500);
    return () => clearTimeout(t);
  }, [isSessionSet, permission]);

  async function enable() {
    setLoading(true);
    setError(null);
    try {
      const ok = await enablePushForUser(sessionName);
      if (ok) {
        setPermission(getPermission());
        setShowModal(false);
        return;
      }
      // enablePushForUser returned false — service worker not ready (dev mode)
      setError("Push notifications require the production build. They will work on footbolski.org.");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setError("Create your player card first (Players tab), then come back to enable notifications.");
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || "Could not enable notifications — try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function dismissModal() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setShowModal(false);
  }

  // In dev mode, push notifications can't work (no service worker) — skip entirely
  if (IS_DEV) return null;

  // Nothing to show if already granted, denied, or unsupported
  if (permission !== "default" || !isSessionSet) return null;

  return (
    <>
      {/* Modal — no close button, no dismiss option */}
      <Modal title="Stay in the loop" open={showModal} onClose={undefined}>
        <div className="grid gap-4">
          <p className="text-white/70">
            Enable push notifications to get notified when a match is created, cancelled, or when it's time to pay. This is required to use the app.
          </p>
          <Button disabled={loading} icon={<Bell size={18} />} onClick={enable}>
            {loading ? "Enabling…" : "Enable Notifications"}
          </Button>
          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
          ) : null}
        </div>
      </Modal>

      {/* Persistent banner when modal is not shown */}
      {!showModal && (
        <div className="mx-auto mt-2 max-w-5xl px-4">
          <div className="flex items-center gap-3 rounded-lg border border-pitch-400/30 bg-pitch-400/10 px-4 py-3">
            <Bell className="shrink-0 text-pitch-400" size={18} />
            <p className="flex-1 text-sm font-semibold text-pitch-300">
              Notifications required.{" "}
              <button className="underline" onClick={() => setShowModal(true)} type="button">
                Enable now
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
