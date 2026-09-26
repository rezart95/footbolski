import { useEffect, useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  title: string;
  open: boolean;
  children: ReactNode;
  onClose?: () => void;
}

/** A sheet of paper laid over the page: bottom sheet on phones, centred panel
 * from 640px. Square, ink-ruled, no shadow; the page behind is dimmed with
 * flat ink. Escape closes it when it is closable. */
export function Modal({ title, open, children, onClose }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/60 sm:items-center sm:justify-center sm:p-4">
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="flex max-h-[92dvh] w-full flex-col border-t-2 border-fg bg-ground text-fg sm:max-w-md sm:border-2"
        role="dialog"
      >
        <div className="flex flex-none items-start justify-between gap-3 px-5 pb-3 pt-5">
          <h2 className="t-headline text-[2rem]" id={titleId}>
            {title}
          </h2>
          {onClose ? <Button aria-label="Close" className="-mr-3 -mt-2" icon={<X size={22} />} onClick={onClose} variant="ghost" /> : null}
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </section>
    </div>
  );
}
