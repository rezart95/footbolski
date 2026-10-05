import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { NameEntryModal } from "../features/session/NameEntryModal";
import { InstallBanner } from "../features/pwa/InstallBanner";
import { OfflineIndicator } from "./OfflineIndicator";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-ground pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-fg">
      {/* TopBar is first so it owns the notch/safe-area; banners sit below it. */}
      <TopBar />
      <InstallBanner />
      <main className="mx-auto max-w-lg px-4 py-6">{children}</main>
      <BottomNav />
      <OfflineIndicator />
      {/* Opens by itself until a name (and terms acceptance) is on file. */}
      <NameEntryModal />
    </div>
  );
}
