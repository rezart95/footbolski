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
 * What is left: the wordmark so the page is recognisably Footbolski, the
 * content, and one quiet way in for anyone who wants more. */
export function LinkLayout({ children }: LinkLayoutProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-ground text-fg">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col px-5 pb-8 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <p className="border-b-2 border-fg pb-3 font-poster text-[1.4rem] font-black leading-none tracking-tight [font-stretch:85%]">
          FOOTBOLSKI
        </p>

        <main className="flex-1 pt-8">{children}</main>

        <Link className="tap-target mt-8 inline-flex items-center self-start text-[15px] font-semibold underline decoration-2" to="/">
          Open Footbolski
        </Link>
      </div>
    </div>
  );
}
