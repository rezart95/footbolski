import { ChevronDown } from "lucide-react";

interface SwapOption {
  swap: string;
  reason: string;
}

interface AIInsightsPanelProps {
  reasoning: string;
  swapOptions?: SwapOption[] | null;
}

/** Why the teams came out this way, in Claude's words. Collapsed by default so
 * the sides themselves stay the first thing you read. */
export function AIInsightsPanel({ reasoning, swapOptions }: AIInsightsPanelProps) {
  return (
    <details className="group border-y-2 border-fg">
      <summary className="tap-target flex cursor-pointer list-none items-center justify-between gap-3 py-3 [&::-webkit-details-marker]:hidden">
        <span className="t-title text-[1.35rem]">Why these teams</span>
        <ChevronDown className="shrink-0 transition-transform duration-200 group-open:rotate-180" size={22} />
      </summary>

      <div className="grid gap-5 pb-5">
        <p className="max-w-[60ch] whitespace-pre-line text-[17px] leading-relaxed text-fg/85">
          {reasoning.replace(/\*\*/g, "")}
        </p>

        {swapOptions && swapOptions.length > 0 ? (
          <div>
            <h4 className="text-[15px] font-bold">Swaps worth considering</h4>
            <ul className="mt-2 divide-y divide-fg/20 border-y border-fg/20">
              {swapOptions.map((opt, i) => (
                <li className="py-3" key={i}>
                  <p className="text-[15px] font-semibold leading-snug">{opt.swap}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-fg/75">{opt.reason}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="text-[13px] font-medium text-fg/70">Split by Claude from everyone&rsquo;s player cards.</p>
      </div>
    </details>
  );
}
