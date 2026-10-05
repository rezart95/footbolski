import { format, parseISO } from "date-fns";
import { usePublicStats } from "../../../hooks/usePublicStats";

/** Ochre is money, so only the paid figures take it; the rest stay paper. */
function Figure({ children, money = false }: { children: React.ReactNode; money?: boolean }) {
  return <span className={money ? "text-poster-ochre tabular-nums" : "tabular-nums"}>{children}</span>;
}

/** The proof, set as one poster sentence rather than a row of stat tiles.
 * Live from the group's own matches; falls back to a plain line when the API
 * is unreachable so the section never shows broken placeholders. */
export function LiveNumbers() {
  const { data, isLoading, isError } = usePublicStats();

  if (isLoading) {
    return (
      <p className="font-poster text-[2rem] font-extrabold leading-[1.05] text-paper/40 [font-stretch:78%] md:text-[3.75rem]" aria-busy="true">
        Counting this season&rsquo;s matches…
      </p>
    );
  }

  if (isError || !data || data.matches_played === 0) {
    return (
      <p className="font-poster text-[2rem] font-extrabold leading-[1.05] [font-stretch:78%] md:text-[3.75rem]">
        Played every week in Kraków.
      </p>
    );
  }

  const since = data.first_match_on ? format(parseISO(data.first_match_on), "MMMM yyyy") : null;
  const cancelled =
    data.matches_cancelled === 0 ? "None cancelled." : `${data.matches_cancelled} cancelled.`;

  return (
    <p className="max-w-[24ch] font-poster text-[2rem] font-extrabold leading-[1.05] [font-stretch:78%] md:text-[3.75rem]">
      <Figure>{data.matches_played}</Figure> matches played in Kraków{since ? ` since ${since}` : ""}.{" "}
      {cancelled} <Figure money>{data.spots_paid}</Figure> of <Figure money>{data.spots_filled}</Figure> spots paid for.{" "}
      <Figure>{data.team_splits}</Figure> of the <Figure>{data.matches_played}</Figure> had teams split by AI.
    </p>
  );
}
