import { useEffect, useRef } from "react";
import { useSession } from "./useSession";
import { enablePushForUser } from "../lib/push";

const PUSH_SAVED_KEY = "push_subscription_saved";

/**
 * On first load (and whenever the session name changes), try to bind a Web
 * Push subscription to the active player. Retries on every page load until
 * the backend confirms the subscription was saved (player card must exist).
 */
export function usePushAutoEnable() {
  const { sessionName, isSessionSet } = useSession();
  const lastTried = useRef<string>("");

  useEffect(() => {
    if (!isSessionSet) return;
    // Always retry if the subscription was never confirmed saved to the backend,
    // OR if the session name changed.
    const savedFor = localStorage.getItem(PUSH_SAVED_KEY);
    if (lastTried.current === sessionName && savedFor === sessionName) return;
    lastTried.current = sessionName;

    enablePushForUser(sessionName)
      .then((ok) => {
        if (ok) {
          localStorage.setItem(PUSH_SAVED_KEY, sessionName);
        }
      })
      .catch(() => undefined);
  }, [sessionName, isSessionSet]);
}
