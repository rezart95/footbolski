import { FormEvent, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { CalendarPlus } from "lucide-react";
import { useCreateEvent, useVenues } from "../../../hooks/useEvents";
import { useSession } from "../../../hooks/useSession";
import { Button } from "../../ui/Button";
import { Field, Input, Select } from "../../ui/Field";
import { Modal } from "../../ui/Modal";

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
  const { data: venues = [], isError, isLoading } = useVenues();
  const { sessionName } = useSession();
  const createEvent = useCreateEvent();
  const [venueId, setVenueId] = useState("");
  const venue = useMemo(() => venues.find((item) => item.id === venueId) ?? venues[0], [venueId, venues]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!venue) {
      return;
    }
    createEvent.mutate(
      {
        venue_id: venue.id,
        event_date: date || nextDateForDay(venue.default_day),
        event_time: time || venue.default_time || "19:30",
        max_players: venue.max_players,
        created_by_name: sessionName
      },
      { onSuccess: onClose }
    );
  }

  return (
    <Modal title="Create Event" open={open} onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>
        <Field label="Venue">
          <Select disabled={isLoading || venues.length === 0} value={venue?.id ?? ""} onChange={(event) => setVenueId(event.target.value)}>
            {venues.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.max_players})
              </option>
            ))}
          </Select>
        </Field>
        {isError ? <p className="text-sm font-semibold text-red-200">Backend is offline. Start the API to load venues.</p> : null}
        <Field label="Date">
          <Input type="date" value={date || nextDateForDay(venue?.default_day ?? null)} onChange={(event) => setDate(event.target.value)} />
        </Field>
        <Field label="Time">
          <Input type="time" value={time || venue?.default_time?.slice(0, 5) || "19:30"} onChange={(event) => setTime(event.target.value)} />
        </Field>
        <Button disabled={createEvent.isPending || !venue || isLoading} icon={<CalendarPlus size={18} />} type="submit">
          Create Event
        </Button>
      </form>
    </Modal>
  );
}
