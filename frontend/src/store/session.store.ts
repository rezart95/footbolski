import { create } from "zustand";

interface SessionState {
  sessionName: string;
  setSessionName: (name: string) => void;
  hasJoinedWhatsapp: boolean;
  setHasJoinedWhatsapp: (joined: boolean) => void;
}

const storedName = localStorage.getItem("session_name") ?? "";
const storedJoinedWhatsapp = localStorage.getItem("has_joined_whatsapp") === "true";

export const useSessionStore = create<SessionState>((set) => ({
  sessionName: storedName,
  setSessionName: (name) => {
    localStorage.setItem("session_name", name);
    set({ sessionName: name });
  },
  hasJoinedWhatsapp: storedJoinedWhatsapp,
  setHasJoinedWhatsapp: (joined) => {
    localStorage.setItem("has_joined_whatsapp", String(joined));
    set({ hasJoinedWhatsapp: joined });
  }
}));