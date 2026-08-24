import { useMemo } from "react";
import { useSessionStore } from "../store/session.store";

export function useSession() {
  const sessionName = useSessionStore((state) => state.sessionName);
  const setSessionName = useSessionStore((state) => state.setSessionName);
  const hasJoinedWhatsapp = useSessionStore((state) => state.hasJoinedWhatsapp);
  const setHasJoinedWhatsapp = useSessionStore((state) => state.setHasJoinedWhatsapp);

  return useMemo(
    () => ({
      sessionName,
      setSessionName,
      isSessionSet: sessionName.trim().length > 0,
      hasJoinedWhatsapp,
      setHasJoinedWhatsapp
    }),
    [sessionName, setSessionName, hasJoinedWhatsapp, setHasJoinedWhatsapp]
  );
}