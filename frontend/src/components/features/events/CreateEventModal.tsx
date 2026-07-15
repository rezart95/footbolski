import { FormEvent, useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { CalendarPlus } from "lucide-react";
import { useCreateEvent, useVenues } from "../../../hooks/useEvents";
import { useSession } from "../../../hooks/useSession";
import { usePlayers } from "../../../hooks/usePlayers";
import { errorMessage } from "../../../lib/errors";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_HANDLE_LABEL,
  PAYMENT_HANDLE_PLACEHOLDER,
  type PaymentMethod,
} from "../../../types/event.types";
import { Button } from "../../ui/Button";
import { Field, Input, Select } from "../../ui/Field";
import { Modal } from "../../ui/Modal";
import { Notice } from "../../ui/Notice";

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
}

function nextDateForDay(isoDay: number | null) {
  const today = new Date();
  if (isoDay === null) {
    return format(today, "yyyy-MM-dd");
  }
  const current = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const diff = (isoDay - current + 7) % 7 || 7;
  return format(addDays(today, diff), "yyyy-MM-dd");
}

export function CreateEventModal({ open, onClose }: CreateEventModalProps) {
  const { data: venues = [], isError: venuesError, isLoading } = useVenues();
  const { data: players = [] } = usePlayers();
  const { sessionName } = useSession();
  const createEvent = useCreateEvent();

  const [venueId, setVenueId] = useState("");
  const venue = useMemo(() => venues.find((item) => item.id === venueId) ?? venues[0], [venueId, venues]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [maxPlayers, setMaxPlayers] = useState<number | "">(""); // "" = not yet overridden

  // Payment: "after" = TBD after match; "now" = set amount now
  const [paymentMode, setPaymentMode] = useState<"after" | "now">("after");
  const [pricePerPerson, setPricePerPerson] = useState("");
  const [payToName, setPayToName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("blik");
  const [paymentDetails, setPaymentDetails] = useState("");

  useEffect(() => {
    if (!venueId && venues.length > 0) {
      setVenueId(venues[0].id);
    }
  }, [venueId, venues]);

  // When venue changes, reset max players override
  useEffect(() => {
    setMaxPlayers("");
  }, [venueId]);

  const effectiveMaxPlayers = maxPlayers !== "" ? maxPlayers : (venue?.max_players ?? 12);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!venue) return;
    createEvent.mutate(
      {
        venue_id: venue.id,
        event_date: date || nextDateForDay(venue.default_day),
        event_time: time || venue.default_time || "19:30",
        max_players: effectiveMaxPlayers,
        created_by_name: sessionName,
        price_per_person: paymentMode === "now" && pricePerPerson ? parseFloat(pricePerPerson) : null,
        pay_to_name: payToName.trim() || null,
        payment_method: paymentMethod || null,
        payment_details: paymentMethod && paymentDetails.trim() ? paymentDetails.trim() : null,
      },
      { onSuccess: onClose }
    );
  }

  return (
    <Modal title="Create Event" open={open} onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>

        {/* Venue */}
        <Field label="Venue">
          <Select disabled={isLoading || venues.length === 0} value={venue?.id ?? ""} onChange={(e) => setVenueId(e.target.value)}>
            {venues.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </Select>
        </Field>
        {venuesError ? <Notice tone="error">Backend is offline. Start the backend before creating matches.</Notice> : null}
        {createEvent.isError ? <Notice tone="error">{errorMessage(createEvent.error, "Could not create event.")}</Notice> : null}

        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <Input type="date" value={date || nextDateForDay(venue?.default_day ?? null)} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Time">
            <Input type="time" value={time || venue?.default_time?.slice(0, 5) || "19:30"} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>

        {/* Max players */}
        <Field label="Number of players">
          <Input
            min={2} max={40} type="number"
            value={maxPlayers !== "" ? maxPlayers : (venue?.max_players ?? 12)}
            onChange={(e) => setMaxPlayers(e.target.value ? Number(e.target.value) : "")}
          />
        </Field>

        {/* Payment */}
        <p className="text-xs font-bold uppercase text-white/55">Payment</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPaymentMode("after")}
            className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${paymentMode === "after" ? "border-pitch-400 bg-pitch-400/15 text-pitch-400" : "border-white/10 bg-white/[0.04] text-white/55 hover:border-white/20"}`}
          >
            Set after match
          </button>
          <button
            type="button"
            onClick={() => setPaymentMode("now")}
            className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${paymentMode === "now" ? "border-pitch-400 bg-pitch-400/15 text-pitch-400" : "border-white/10 bg-white/[0.04] text-white/55 hover:border-white/20"}`}
          >
            Set amount now
          </button>
        </div>
        {paymentMode === "now" && (
          <Field label="Amount per person (zł)">
            <Input
              min={0} step="0.5" type="number" placeholder="e.g. 8"
              value={pricePerPerson}
              onChange={(e) => setPricePerPerson(e.target.value)}
            />
          </Field>
        )}

        {/* Payment method */}
        <Field label="Payment method">
          <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | "")}>
            <option value="">— not specified —</option>
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
              <option key={method} value={method}>{PAYMENT_METHOD_LABELS[method]}</option>
            ))}
          </Select>
        </Field>

        {/* Where to send the payment — contextual to the chosen method */}
        {paymentMethod ? (
          <Field label={`${PAYMENT_HANDLE_LABEL[paymentMethod]} (optional)`}>
            <Input
              type={paymentMethod === "blik" ? "tel" : "text"}
              inputMode={paymentMethod === "blik" ? "tel" : "text"}
              placeholder={PAYMENT_HANDLE_PLACEHOLDER[paymentMethod]}
              value={paymentDetails}
              onChange={(e) => setPaymentDetails(e.target.value)}
            />
          </Field>
        ) : null}

        {/* Pay to */}
        <Field label="Pay to (optional)">
          <Select value={payToName} onChange={(e) => setPayToName(e.target.value)}>
            <option value="">— not specified —</option>
            {players.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </Select>
        </Field>

        <Button disabled={createEvent.isPending || !venue || isLoading} icon={<CalendarPlus size={18} />} type="submit">
          Create Event
        </Button>
      </form>
    </Modal>
  );
}
