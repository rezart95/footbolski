import { useState } from "react";
import { Download, Share, Plus } from "lucide-react";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";
import { usePwaInstall } from "../../../hooks/usePwaInstall";

export function InstallBanner() {
  const { canShow, isIos, promptInstall } = usePwaInstall();
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (!canShow) {
    return null;
  }

  return (
    <>
      <div className="border-b border-pitch-400/25 bg-pitch-400/10 px-4 py-2.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-pitch-400/15 text-pitch-400">
            <Download size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold leading-tight">Install Footbolski</p>
            <p className="truncate text-xs font-semibold text-white/55">
              Add it to your home screen for a full-screen app.
            </p>
          </div>
          {isIos ? (
            <Button className="flex-none px-3 py-2" onClick={() => setShowIosHelp(true)}>
              How?
            </Button>
          ) : (
            <Button className="flex-none px-3 py-2" onClick={() => void promptInstall()}>
              Install
            </Button>
          )}
        </div>
      </div>

      <Modal title="Add to Home Screen" open={showIosHelp} onClose={() => setShowIosHelp(false)}>
        <div className="space-y-4">
          <p className="text-sm font-semibold text-white/70">
            Install Footbolski on your iPhone or iPad in two taps:
          </p>
          <ol className="space-y-3 text-sm font-semibold">
            <li className="flex items-center gap-3">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white/10 text-xs font-extrabold">
                1
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                Tap the Share button
                <Share size={16} className="text-pitch-400" />
                in the toolbar.
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white/10 text-xs font-extrabold">
                2
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                Choose
                <span className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5">
                  Add to Home Screen <Plus size={14} className="text-pitch-400" />
                </span>
              </span>
            </li>
          </ol>
          <p className="text-xs font-semibold text-white/55">
            On iPhone the Share button is at the bottom of Safari. This only works in Safari, not Chrome.
          </p>
        </div>
      </Modal>
    </>
  );
}
