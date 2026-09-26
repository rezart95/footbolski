import { useState, type MouseEvent } from "react";
import { AtSign, Check, Copy, Landmark, Smartphone } from "lucide-react";
import type { PaymentMethod } from "../../../types/event.types";

const ICON: Record<PaymentMethod, typeof Smartphone> = {
  blik: Smartphone,
  revolut: AtSign,
  bank_transfer: Landmark,
};

/** A tappable chip showing where to send payment (BLIK phone / Revolut tag /
 * account) that copies the value to the clipboard on click. Safe to use inside
 * a Link — it stops the click from navigating. Takes its ink from the text
 * colour around it, so it works on the ochre money field and on the ground. */
export function PaymentHandle({ method, value }: { method: PaymentMethod; value: string }) {
  const [copied, setCopied] = useState(false);
  const Icon = ICON[method];

  async function copy(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${value}`}
      className="tap-target flex w-full items-center justify-between gap-3 border-2 border-current px-3 text-left transition-colors duration-150 hover:bg-ink/[0.06]"
    >
      <span className="flex min-w-0 items-center gap-2 text-[16px] font-bold tabular-nums">
        <Icon size={17} className="shrink-0" />
        <span className="break-all">{value}</span>
      </span>
      <span aria-live="polite" className="flex shrink-0 items-center gap-1 text-[14px] font-semibold">
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
