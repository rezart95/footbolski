import { CalendarDays, Home, UsersRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/players", label: "Players", icon: UsersRound }
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-pitch-950/95 px-2 pb-3 pt-2 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            className={({ isActive }) =>
              cn("tap-target grid place-items-center rounded-lg text-xs font-bold text-white/55", isActive && "bg-pitch-400 text-pitch-950")
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
