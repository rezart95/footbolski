import { Link } from "react-router-dom";
import { Shield, UserRound } from "lucide-react";
import { useSession } from "../../hooks/useSession";
import { isAdminSession } from "../../lib/roles";

interface TopBarProps {
  onEditName: () => void;
}

/** A slim masthead: the wordmark on the left, who you are on the right.
 * Flat ground with an ink rule under it; it owns the notch. */
export function TopBar({ onEditName }: TopBarProps) {
  const { sessionName } = useSession();
  const isAdmin = isAdminSession(sessionName);
  const firstName = sessionName.trim().split(/\s+/)[0] || "Set your name";

  return (
    <header className="sticky top-0 z-30 border-b-2 border-fg bg-ground pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 pl-4 pr-1">
        <Link
          aria-label="Footbolski, next match"
          className="font-poster text-[1.4rem] font-black leading-none tracking-tight [font-stretch:85%]"
          to="/"
        >
          FOOTBOLSKI
        </Link>
        <div className="flex min-w-0 items-center">
          {isAdmin ? (
            <Link aria-label="Admin" className="tap-target grid place-items-center hover:bg-fg/[0.07]" to="/admin">
              <Shield size={20} />
            </Link>
          ) : null}
          <button
            aria-label={`Signed in as ${sessionName || "nobody"}. Change name`}
            className="tap-target flex min-w-0 items-center gap-2 px-3 text-[15px] font-semibold hover:bg-fg/[0.07]"
            onClick={onEditName}
            type="button"
          >
            <span className="truncate">{firstName}</span>
            <UserRound className="shrink-0" size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
