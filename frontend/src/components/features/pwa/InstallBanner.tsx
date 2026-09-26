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
      <div className="field-inverse px-4 py-2">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Download className="flex-none" size={22} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold leading-tight">Install Footbolski</p>
            <p className="text-[13px] font-medium text-ground/80">
              Add it to your home screen, one tap from the match.
            </p>
          </div>
          {isIos ? (
            <Button className="flex-none" onClick={() => setShowIosHelp(true)} variant="inverse">
              How?
            </Button>
          ) : (
            <Button className="flex-none" onClick={() => void promptInstall()} variant="inverse">
              Install
            </Button>
          )}
        </div>
      </div>

      <Modal title="Add to Home Screen" open={showIosHelp} onClose={() => setShowIosHelp(false)}>
        <div className="space-y-4">
          <p className="text-[17px] text-fg/80">
            Install Footbolski on your iPhone or iPad in two taps:
          </p>
          <ol className="space-y-3 text-[17px] font-semibold">
            <li className="flex items-center gap-3">
              <span className="t-numeral w-6 flex-none text-2xl">1</span>
              <span className="flex flex-wrap items-center gap-1.5">
                Tap the Share button
                <Share size={18} />
                in the toolbar.
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="t-numeral w-6 flex-none text-2xl">2</span>
              <span className="flex flex-wrap items-center gap-1.5">
                Choose
                <span className="inline-flex items-center gap-1 border-2 border-fg px-1.5 py-0.5">
                  Add to Home Screen <Plus size={16} />
                </span>
              </span>
            </li>
          </ol>
          <p className="text-[15px] text-fg/75">
            On iPhone the Share button is at the bottom of Safari. This only works in Safari, not Chrome.
          </p>
        </div>
      </Modal>
    </>
  );
}
