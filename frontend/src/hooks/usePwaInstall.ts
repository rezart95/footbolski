import { useCallback, useEffect, useState } from "react";

// Chromium fires this before showing its native install prompt. It's not in
// the standard DOM typings, so we declare the shape we rely on.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = window.navigator.userAgent;
  const iOSDevice = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ reports as "Macintosh" but has touch support.
  const iPadOS = ua.includes("Macintosh") && "ontouchend" in document;
  return iOSDevice || iPadOS;
}

export interface PwaInstall {
  /** Banner should be visible right now. */
  canShow: boolean;
  /** Platform can't prompt programmatically — show manual instructions instead. */
  isIos: boolean;
  /** Trigger the native Chromium install prompt. Returns true if accepted. */
  promptInstall: () => Promise<boolean>;
}

export function usePwaInstall(): PwaInstall {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const ios = isIos();

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") {
      setInstalled(true);
      return true;
    }
    return false;
  }, [deferred]);

  // On iOS there's no beforeinstallprompt, so we rely on platform + install
  // state. Elsewhere we only show once Chromium tells us we're installable.
  // The banner is not dismissible — it stays until the app is installed.
  const canShow = !installed && (ios || deferred !== null);

  return { canShow, isIos: ios, promptInstall };
}
