import { useMemo } from "react";
import { useSessionStore } from "../store/session.store";

export function useSession() {
  const sessionName = useSessionStore((state) => state.sessionName);
  const setSessionName = useSessionStore((state) => state.setSessionName);

  return useMemo(
    () => ({
      sessionName,
      setSessionName,
      isSessionSet: sessionName.trim().length > 0
    }),
    [sessionName, setSessionName]
  );
}
