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
    <div className="min-h-screen overflow-x-hidden pb-[calc(7rem+env(safe-area-inset-bottom))]">
      {/* TopBar is first so it owns the notch/safe-area; banners sit below it. */}
      <TopBar onEditName={() => setEditingName(true)} />
      <InstallBanner />
      <NotificationPrompt />
      <main className="mx-auto max-w-lg px-4 py-5">{children}</main>
      <BottomNav />
      <OfflineIndicator />
      <NameEntryModal forceOpen={editingName} onClose={() => setEditingName(false)} />
    </div>
  );
}

