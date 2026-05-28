import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, _r) {
      // SW registered — no action needed
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 bg-emerald-700 px-4 py-3 text-white shadow-lg">
      <span className="text-sm font-medium">A new version of the app is ready.</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="flex shrink-0 items-center gap-1.5 rounded-md bg-white/20 px-3 py-1.5 text-sm font-semibold hover:bg-white/30 active:bg-white/40"
      >
        <RefreshCw size={14} />
        Update
      </button>
    </div>
  );
}
