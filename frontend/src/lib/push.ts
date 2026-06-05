import { api } from "./axios";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function fetchVapidKey(): Promise<string | null> {
  const { data } = await api.get<{ public_key: string | null }>("/push/vapid-public-key");
  return data.public_key;
}

async function getReadyRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  return navigator.serviceWorker.ready;
}

/** Subscribe the current browser to Web Push and bind it to a player display name. */
export async function enablePushForUser(displayName: string): Promise<boolean> {
  if (!displayName) return false;
  const reg = await getReadyRegistration();
  if (!reg) return false;

  if (Notification.permission === "denied") return false;
  if (Notification.permission === "default") {
    const result = await Notification.requestPermission();
    if (result !== "granted") return false;
  }

  const publicKey = await fetchVapidKey();
  if (!publicKey) return false;

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Push subscribe timed out — check your network and try again.")), 15_000)
    );
    subscription = await Promise.race([
      reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }),
      timeout,
    ]);
  }

  const json = subscription.toJSON();
  await api.post("/push/subscriptions", {
    display_name: displayName,
    endpoint: json.endpoint,
    keys: json.keys,
    user_agent: navigator.userAgent,
  });
  return true;
}

export async function disablePushForCurrentDevice(): Promise<void> {
  const reg = await getReadyRegistration();
  if (!reg) return;
  const subscription = await reg.pushManager.getSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe().catch(() => undefined);
  await api.delete("/push/subscriptions", { data: { endpoint } });
}
