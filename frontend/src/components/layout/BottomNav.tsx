import { CalendarDays, Home, LayoutGrid, UsersRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";

const items = [
  { to: "/", label: "Match", icon: Home },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/pitch", label: "Pitch", icon: LayoutGrid },
  { to: "/players", label: "Players", icon: UsersRound },
];

/** An ink bar across the foot of the screen. The current tab is cut out of
 * it in the page's own ground, so it reads as the page you are on. */
export function BottomNav() {
  return (
    <nav aria-label="Main" className="field-inverse fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            className={({ isActive }) =>
              cn(
                "tap-target flex h-16 flex-col items-center justify-center gap-1 text-[13px] font-semibold transition-colors duration-150",
                isActive ? "bg-ground text-fg" : "text-ground/80 hover:text-ground"
              )
            }
            end={to === "/"}
            key={to}
            to={to}
          >
            <Icon size={22} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
