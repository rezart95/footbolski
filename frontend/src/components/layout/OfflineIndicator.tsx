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
    <div className="fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-500/20 px-4 py-2 text-xs font-extrabold text-amber-100 backdrop-blur-xl">
        <WifiOff size={15} />
        You're offline — showing last-saved data.
      </div>
    </div>
  );
}
