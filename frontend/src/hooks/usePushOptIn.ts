import { useCallback, useEffect, useState } from "react";
import { enablePushForUser } from "../lib/push";
import { useSession } from "./useSession";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function pushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

const SNOOZE_KEY = "push_prompt_snoozed_at";
// After dismissing, the banner stays hidden this long, then reappears — a
// gentle "from time to time" nudge rather than nagging on every screen.
const SNOOZE_TTL_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

function isSnoozed(): boolean {
  const raw = localStorage.getItem(SNOOZE_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  return Number.isFinite(ts) && Date.now() - ts < SNOOZE_TTL_MS;
}

export interface PushOptIn {
  /** Prompt should be visible right now. */
  canShow: boolean;
  /** true while the subscribe request is in flight. */
  busy: boolean;
  /** User previously blocked notifications in the browser. */
  blocked: boolean;
  /** Request permission + subscribe. Returns true on success. */
  enable: () => Promise<boolean>;
  /** Hide the banner for a few days (it reappears afterwards). */
  snooze: () => void;
}

export function usePushOptIn(): PushOptIn {
  const { sessionName } = useSession();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [snoozed, setSnoozed] = useState(isSnoozed);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    pushSupported() ? Notification.permission : null,
  );

  // If this device already has a live push subscription, treat it as enabled.
  useEffect(() => {
    if (!pushSupported()) return;
    let cancelled = false;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (!cancelled && sub) setEnabled(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async () => {
    if (!sessionName) return false;
    setBusy(true);
    try {
      const ok = await enablePushForUser(sessionName);
      setPermission(pushSupported() ? Notification.permission : null);
      if (ok) setEnabled(true);
      return ok;
    } finally {
      setBusy(false);
    }
  }, [sessionName]);

  const snooze = useCallback(() => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now()));
    setSnoozed(true);
  }, []);

  const blocked = permission === "denied";

  // Only ask once the app is installed (required for push on iOS) and the user
  // has picked a name, while they haven't enabled/blocked it, and not during a
  // snooze window.
  const canShow =
    pushSupported() &&
    isStandalone() &&
    Boolean(sessionName) &&
    !enabled &&
    !blocked &&
    !snoozed;

  return { canShow, busy, blocked, enable, snooze };
}
