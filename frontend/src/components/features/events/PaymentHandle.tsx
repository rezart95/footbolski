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
 * a Link — it stops the click from navigating. */
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
      className="flex w-full items-center justify-between gap-2 rounded-md border border-pitch-400/20 bg-pitch-400/10 px-2.5 py-1.5 text-left transition hover:bg-pitch-400/20"
    >
      <span className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-pitch-400">
        <Icon size={15} className="shrink-0" />
        <span className="truncate">{value}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-pitch-400/70">
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
