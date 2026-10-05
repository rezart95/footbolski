import { Link } from "react-router-dom";
import { cn } from "../../../lib/utils";

/** The primary action, set inside a notched ink ticket (ochre is reserved for
 * money). Identity is still just a name: the link goes into the app, where the
 * name-entry modal opens by itself (name, WhatsApp group, terms) until a
 * session exists. */
export function JoinTicket({ className, label = "Join the game" }: { className?: string; label?: string }) {
  return (
    <div className={cn("poster-ticket bg-ink px-7 py-4 text-paper sm:py-5", className)}>
      <p className="font-poster text-xl font-extrabold leading-tight [font-stretch:80%]">{label}</p>
      <Link
        to="/events"
        className="mt-3 inline-flex h-12 w-full items-center justify-center border-2 border-paper bg-paper px-6 text-[16px] font-semibold text-ink transition-colors hover:bg-white active:bg-paper/80 sm:w-auto"
      >
        Enter your name
      </Link>
    </div>
  );
}
