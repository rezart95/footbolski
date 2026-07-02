import { CalendarDays, Home, LayoutGrid, UsersRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/pitch", label: "Pitch", icon: LayoutGrid },
  { to: "/players", label: "Players", icon: UsersRound },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <div className="surface mx-auto grid max-w-md grid-cols-4 gap-1 rounded-lg bg-pitch-950/90 p-1 backdrop-blur-xl">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            className={({ isActive }) =>
              cn("tap-target grid place-items-center rounded-md text-xs font-bold text-white/55", isActive && "bg-pitch-400 text-pitch-950")
            }
            end={to === "/"}
            key={to}
            to={to}
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
