import { useState } from "react";
import { Link } from "react-router-dom";
import { Settings, Shield } from "lucide-react";
import { NameEntryModal } from "../features/session/NameEntryModal";
import { useSession } from "../../hooks/useSession";
import { isAdminSession } from "../../lib/roles";

/** A slim masthead: the wordmark on the left, the admin door and the account
 * switch on the right for admins. Flat ground with an ink rule under it; it
 * owns the notch. Everyone else changes their name from the You tab. */
export function TopBar() {
  const { sessionName } = useSession();
  const isAdmin = isAdminSession(sessionName);
  const [editingName, setEditingName] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b-2 border-fg bg-ground pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 pl-4 pr-1">
          <Link
            aria-label="Footbolski, next match"
            className="font-poster text-[1.4rem] font-black leading-none tracking-tight [font-stretch:85%]"
            to="/"
          >
            FOOTBOLSKI
          </Link>
          {isAdmin ? (
            <div className="flex items-center">
              <Link
                className="tap-target flex items-center gap-2 px-3 text-[15px] font-semibold hover:bg-fg/[0.07]"
                to="/admin"
              >
                <Shield size={19} />
                Admin
              </Link>
              <button
                aria-label="Change account"
                className="tap-target flex items-center justify-center px-3 hover:bg-fg/[0.07]"
                onClick={() => setEditingName(true)}
                type="button"
              >
                <Settings size={19} />
              </button>
            </div>
          ) : null}
        </div>
      </header>
      {/* Outside the header: its z-30 stacking context would put the sheet under the z-40 tab bar. */}
      {editingName ? <NameEntryModal forceOpen onClose={() => setEditingName(false)} /> : null}
    </>
  );
}
