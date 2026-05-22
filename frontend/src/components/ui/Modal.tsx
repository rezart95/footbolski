import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  title: string;
  open: boolean;
  children: ReactNode;
  onClose?: () => void;
}

export function Modal({ title, open, children, onClose }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <section className="w-full rounded-lg border border-white/10 bg-pitch-900 p-5 shadow-glow sm:max-w-md">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">{title}</h2>
          {onClose ? <Button aria-label="Close" icon={<X size={18} />} onClick={onClose} variant="ghost" /> : null}
        </div>
        {children}
      </section>
    </div>
  );
}
