import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface LinkLayoutProps {
  children: ReactNode;
}

/** Shell for pages reached from a WhatsApp link.
 *
 * Deliberately NOT AppShell. These pages open in the WhatsApp in-app browser,
 * where the install banner is a demand the browser often cannot satisfy, and it
 * would sit above the answer the player actually tapped for. Bottom navigation
 * is just as unhelpful to somebody with no relationship to the app yet.
 *
 * What is left: a small wordmark so the page is recognisably Footbolski, the
 * content, and one quiet way in for anyone who wants more. */
export function LinkLayout({ children }: LinkLayoutProps) {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col px-5 pb-8 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-white/40">
          Footbolski
        </p>

        <main className="flex-1 pt-6">{children}</main>

        <Link
          className="mt-8 self-start text-xs font-bold text-white/40 underline-offset-4 hover:text-white/70 hover:underline"
          to="/"
        >
          Open Footbolski
        </Link>
      </div>
    </div>
  );
}
