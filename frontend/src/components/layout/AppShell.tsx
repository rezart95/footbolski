import type { ReactNode } from "react";
import { useState } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { NameEntryModal } from "../features/session/NameEntryModal";
import { InstallBanner } from "../features/pwa/InstallBanner";
import { NotificationPrompt } from "../features/pwa/NotificationPrompt";
import { OfflineIndicator } from "./OfflineIndicator";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [editingName, setEditingName] = useState(false);

  return (
    <div className="min-h-screen pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <InstallBanner />
      <NotificationPrompt />
      <TopBar onEditName={() => setEditingName(true)} />
      <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
      <BottomNav />
      <OfflineIndicator />
      <NameEntryModal forceOpen={editingName} onClose={() => setEditingName(false)} />
    </div>
  );
}

