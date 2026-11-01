import { useState, type FormEvent } from "react";
import { addHours, format, parseISO } from "date-fns";
import { Save } from "lucide-react";
import { Button } from "../../ui/Button";
import { Field, Input } from "../../ui/Field";
import { Notice } from "../../ui/Notice";
import { useSession } from "../../../hooks/useSession";
import { useSetEventCost } from "../../../hooks/useEvents";
import { errorMessage } from "../../../lib/errors";
import { formatPrice, splitCost } from "../../../lib/money";
import type { EventSummary } from "../../../types/event.types";

/** Hours between saving the amount and the WhatsApp payment request. Mirrors
 * `payment_request_delay_hours` on the server. */
const REQUEST_DELAY_HOURS = 12;

interface EventCostPanelProps {
  event: EventSummary;
  confirmedCount: number;
  /** The organiser of a finished match that is priced after full time. */
  canEdit: boolean;
}

/** The bill, for matches priced after full time (Fame Sport: Multisport cards
 * change the pitch cost every week). The organiser enters what was paid and the
 * app splits it over the players; everyone sees the total once it is in. */
export function EventCostPanel({ event, confirmedCount, canEdit }: EventCostPanelProps) {
  const { sessionName } = useSession();
  const setCost = useSetEventCost(event.id);
  const [total, setTotal] = useState("");
  const [editing, setEditing] = useState(false);

  const hasCost = event.total_cost != null;
  const sendAt = event.cost_set_at ? addHours(parseISO(event.cost_set_at), REQUEST_DELAY_HOURS) : null;
  // Once the request is due the server refuses changes, so stop offering them.
  const canChange = canEdit && hasCost && (sendAt === null || Date.now() < sendAt.getTime());

  const amount = Number(total.replace(",", "."));
  const valid = total.trim() !== "" && Number.isFinite(amount) && amount > 0 && confirmedCount > 0;

  function submit(submitEvent: FormEvent) {
    submitEvent.preventDefault();
    if (!valid) return;
    setCost.mutate(
      { createdByName: sessionName, totalCost: amount },
      {
        onSuccess: () => {
          setEditing(false);
          setTotal("");
        }
      }
    );
  }

  if (canEdit && (!hasCost || editing)) {
    return (
      <form className="mt-5 grid gap-3 border-t-2 border-ink pt-4" onSubmit={submit}>
        <Field label="What did the pitch cost in total? (zł)">
          <Input
            autoFocus={editing}
            inputMode="decimal"
            min={0.01}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="e.g. 280"
            step="0.01"
            type="number"
            value={total}
          />
        </Field>
        <p aria-live="polite" className="min-h-[1.5rem] text-[16px] font-bold tabular-nums">
          {valid
            ? `${formatPrice(amount)} ÷ ${confirmedCount} players = ${formatPrice(splitCost(amount, confirmedCount))} each`
            : `${confirmedCount} ${confirmedCount === 1 ? "player" : "players"} played.`}
        </p>
        <p className="text-[15px]">
          Enter the amount after any Multisport discounts. Everyone who hasn&rsquo;t paid gets a WhatsApp payment
          request {REQUEST_DELAY_HOURS} hours after you save.
        </p>
        {setCost.isError ? <Notice tone="error">{errorMessage(setCost.error, "Could not save the amount.")}</Notice> : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={!valid || setCost.isPending} icon={<Save size={18} />} type="submit" variant="inverse">
            {setCost.isPending ? "Saving…" : "Save amount"}
          </Button>
          {editing ? (
            <Button onClick={() => setEditing(false)} type="button" variant="inverse-outline">
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    );
  }

  if (!hasCost) return null;

  return (
    <div className="mt-3 text-[16px]">
      <p className="font-semibold tabular-nums">{formatPrice(Number(event.total_cost))} total</p>
      {canChange && sendAt ? (
        <>
          <p className="mt-1">
            Payment requests go out on WhatsApp from about {format(sendAt, "EEE d MMM, HH:mm")} (never before 08:00).
          </p>
          <button
            className="tap-target mt-1 -ml-1 px-1 text-[15px] font-semibold underline decoration-2"
            onClick={() => {
              setTotal(String(event.total_cost));
              setEditing(true);
            }}
            type="button"
          >
            Change the amount
          </button>
        </>
      ) : null}
    </div>
  );
}
