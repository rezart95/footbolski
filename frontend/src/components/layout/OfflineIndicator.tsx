import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-50" role="status">
      <div className="field-inverse mx-auto flex max-w-lg items-center gap-2 border-b-2 border-ground/30 px-4 py-2 text-[13px] font-semibold">
        <WifiOff size={16} />
        You&rsquo;re offline. Showing the last saved list.
      </div>
    </div>
  );
}
