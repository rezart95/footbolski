import { create } from "zustand";

interface SessionState {
  sessionName: string;
  setSessionName: (name: string) => void;
}

const storedName = localStorage.getItem("session_name") ?? "";

export const useSessionStore = create<SessionState>((set) => ({
  sessionName: storedName,
  setSessionName: (name) => {
    localStorage.setItem("session_name", name);
    set({ sessionName: name });
  }
}));
