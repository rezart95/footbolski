import { useState } from "react";
import { Link } from "react-router-dom";
import { analyticsEnabled, getAnalyticsChoice, setAnalyticsChoice } from "../../../lib/analytics";
import { Button } from "../../ui/Button";

/** One-time analytics question. Shown until a choice is stored; declining is as
 * easy as accepting and the app works identically either way. */
export function AnalyticsConsent() {
  const [answered, setAnswered] = useState(() => getAnalyticsChoice() !== null);

  if (!analyticsEnabled || answered) return null;

  function choose(choice: "granted" | "denied") {
    setAnalyticsChoice(choice);
    setAnswered(true);
  }

  return (
    <div
      aria-label="Analytics"
      className="field-inverse fixed inset-x-0 bottom-0 z-[60] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
      role="dialog"
    >
      <div className="mx-auto flex max-w-lg flex-col gap-3">
        <p className="text-[15px] font-medium leading-snug">
          Can we count visits with Google Analytics? It shows us which screens get used. No ads, and
          your name is never sent. <Link className="font-semibold underline decoration-2" to="/terms">Terms</Link>
        </p>
        <div className="flex gap-3">
          <Button className="flex-1" onClick={() => choose("denied")} variant="inverse-outline">
            No thanks
          </Button>
          <Button className="flex-1" onClick={() => choose("granted")} variant="inverse">
            Yes, count me in
          </Button>
        </div>
      </div>
    </div>
  );
}
