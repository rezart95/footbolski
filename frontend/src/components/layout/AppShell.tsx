import type { ReactNode } from "react";
import { useState } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { NameEntryModal } from "../features/session/NameEntryModal";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [editingName, setEditingName] = useState(false);

  return (
    <div className="min-h-screen pb-28">
      <TopBar onEditName={() => setEditingName(true)} />
      <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
      <BottomNav />
      <NameEntryModal forceOpen={editingName} onClose={() => setEditingName(false)} />
    </div>
  );
}

