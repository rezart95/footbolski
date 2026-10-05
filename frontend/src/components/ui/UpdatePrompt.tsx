import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="field-inverse fixed left-0 right-0 top-0 z-50 flex items-center justify-between gap-3 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
      <span className="text-[15px] font-semibold">A new version of Footbolski is ready.</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="tap-target flex shrink-0 items-center gap-2 bg-ground px-4 text-[15px] font-bold text-fg"
        type="button"
      >
        <RefreshCw size={16} />
        Update
      </button>
    </div>
  );
}
