import { Bell, BellOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { enablePushForUser } from "../../../lib/push";
import { useSession } from "../../../hooks/useSession";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";

const DISMISSED_KEY = "push_prompt_dismissed";

function getPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export function PushPrompt() {
  const { sessionName, isSessionSet } = useSession();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(getPermission);
  const [showModal, setShowModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => !!localStorage.getItem(DISMISSED_KEY));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show first-visit modal once session is set and push is not yet decided
  useEffect(() => {
    if (!isSessionSet) return;
    if (permission !== "default") return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    // Small delay so the app has loaded
    const t = setTimeout(() => setShowModal(true), 1500);
    return () => clearTimeout(t);
  }, [isSessionSet, permission]);

  async function enable() {
    setLoading(true);
    setError(null);
    try {
      await enablePushForUser(sessionName);
      setPermission(getPermission());
      setShowModal(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setError("Create your player card first (Players tab), then enable notifications.");
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || "Could not enable notifications. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function dismissModal() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setBannerDismissed(true);
    setShowModal(false);
  }

  // Nothing to show if already granted, denied, or unsupported
  if (permission !== "default" || !isSessionSet) return null;

  return (
    <>
      {/* First-visit modal */}
      <Modal title="Stay in the loop" open={showModal} onClose={dismissModal}>
        <div className="grid gap-4">
          <p className="text-white/70">
            Enable push notifications to be notified when a match is created, cancelled, or when it's time to pay.
          </p>
          <div className="flex gap-3">
            <Button disabled={loading} icon={<Bell size={18} />} onClick={enable}>
              {loading ? "Enabling…" : "Enable Notifications"}
            </Button>
            <Button disabled={loading} variant="secondary" onClick={dismissModal}>Not now</Button>
          </div>
          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
          ) : null}
        </div>
      </Modal>

      {/* Persistent banner shown after modal is dismissed */}
      {!showModal && !bannerDismissed && (
        <div className="mx-auto mt-2 max-w-5xl px-4">
          <div className="flex items-center gap-3 rounded-lg border border-pitch-400/30 bg-pitch-400/10 px-4 py-3">
            <Bell className="shrink-0 text-pitch-400" size={18} />
            <p className="flex-1 text-sm font-semibold text-pitch-300">
              Enable notifications to stay updated on events.{" "}
              <button className="underline" onClick={() => setShowModal(true)} type="button">
                Turn on
              </button>
            </p>
            <button
              aria-label="Dismiss"
              className="text-white/40 hover:text-white/70"
              onClick={dismissModal}
              type="button"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* If banner dismissed, still show a subtle icon in corner */}
      {!showModal && bannerDismissed && (
        <div className="mx-auto mt-2 max-w-5xl px-4 text-right">
          <button
            className="inline-flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60"
            onClick={() => setShowModal(true)}
            title="Enable push notifications"
            type="button"
          >
            <BellOff size={14} />
            Notifications off
          </button>
        </div>
      )}
    </>
  );
}
