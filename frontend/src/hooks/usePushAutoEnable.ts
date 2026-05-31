import { useEffect, useRef } from "react";
import { useSession } from "./useSession";
import { enablePushForUser } from "../lib/push";

/**
 * On first load (and whenever the session name changes), try to bind a Web
 * Push subscription to the active player. Silent on failure so it never
 * blocks the UI; the browser still gates the permission prompt.
 */
export function usePushAutoEnable() {
  const { sessionName, isSessionSet } = useSession();
  const lastTried = useRef<string>("");

  useEffect(() => {
    if (!isSessionSet) return;
    if (lastTried.current === sessionName) return;
    lastTried.current = sessionName;
    enablePushForUser(sessionName).catch(() => undefined);
  }, [sessionName, isSessionSet]);
}
