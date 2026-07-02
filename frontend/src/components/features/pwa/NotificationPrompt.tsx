import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "../../ui/Button";
import { usePushOptIn } from "../../../hooks/usePushOptIn";

export function NotificationPrompt() {
  const { canShow, busy, enable } = usePushOptIn();
  const [failed, setFailed] = useState(false);

  if (!canShow) {
    return null;
  }

  async function turnOn() {
    setFailed(false);
    const ok = await enable();
    if (!ok) setFailed(true);
  }

  return (
    <div className="border-b border-sky-400/25 bg-sky-400/10 px-4 pb-2.5 pt-[calc(env(safe-area-inset-top)+0.625rem)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-sky-400/15 text-sky-300">
          <Bell size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold leading-tight">Turn on notifications</p>
          <p className="truncate text-xs font-semibold text-white/55">
            {failed
              ? "Couldn't enable — check notification permissions and try again."
              : "Get match and payment reminders on this device."}
          </p>
        </div>
        <Button className="flex-none px-3 py-2" disabled={busy} onClick={() => void turnOn()}>
          {busy ? "Enabling…" : "Enable"}
        </Button>
      </div>
    </div>
  );
}
