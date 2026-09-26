import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Bib } from "../components/features/landing/Bib";
import { GoogleTicket } from "../components/features/landing/GoogleTicket";
import { LiveNumbers } from "../components/features/landing/LiveNumbers";
import { SplitBall } from "../components/features/landing/SplitBall";
import { Wordmark } from "../components/features/landing/Wordmark";

// Sample data only. None of these are real players: the page is public and the
// roster is private, so every name here is invented.
const REDS = [
  ["Kuba", "GK"],
  ["Tomás", "DEF"],
  ["Emil", "DEF"],
  ["Arben", "MID"],
  ["Oskar", "MID"],
  ["Dario", "ATT"],
  ["Yusuf", "ATT"]
];
const BLUES = [
  ["Paweł", "GK"],
  ["Rui", "DEF"],
  ["Mateo", "DEF"],
  ["Luka", "MID"],
  ["Driton", "MID"],
  ["Nils", "ATT"],
  ["Omar", "ATT"]
];
const PAID_SAMPLE = 12;
const SPOTS = 14;

/** Paints the browser chrome around the page (overscroll, iOS status bar,
 * scrollbar) in paper while the landing is mounted: the landing is a printed
 * poster and stays paper even when the phone (and so the app) is in dark mode. */
function usePaperChrome() {
  useEffect(() => {
    const root = document.documentElement;
    const metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
    const previous = { background: root.style.background, themes: metas.map((meta) => meta.content) };
    root.style.background = "#F2F1EC";
    root.classList.add("landing-chrome");
    metas.forEach((meta) => meta.setAttribute("content", "#F2F1EC"));
    return () => {
      root.style.background = previous.background;
      root.classList.remove("landing-chrome");
      metas.forEach((meta, i) => meta.setAttribute("content", previous.themes[i]));
    };
  }, []);
}

function MemberLink({ className }: { className?: string }) {
  return (
    <Link
      to="/events"
      className={`tap-target inline-flex items-center font-semibold underline decoration-2 underline-offset-[0.25em] hover:decoration-poster-red ${className ?? ""}`}
    >
      I already play here
    </Link>
  );
}

function Sample({ children, className = "text-ink/70" }: { children: string; className?: string }) {
  return <p className={`text-[13px] font-medium ${className}`}>{children}</p>;
}

/** The public front door, shown at `/` to anyone without a session.
 * A run of posters, one job each: who's in, who's paid, fair teams, the proof. */
export function LandingPage() {
  usePaperChrome();

  return (
    <div className="landing relative min-h-screen overflow-x-hidden bg-paper font-grotesk text-ink">
      {/* Poster one: the offer. On desktop the ball leaves the column and runs
          off the right edge of the viewport (`.landing-hero-ball`). */}
      <header className="landing-hero mx-auto max-w-7xl px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 lg:pb-24">
        <div className="flex justify-end">
          <MemberLink className="text-[15px]" />
        </div>
        <Wordmark className="mt-2 text-ink" />

        <div className="mt-3 lg:mt-12 lg:w-[46%]">
          <SplitBall className="landing-hero-ball mx-auto block h-[34svh] max-h-[420px] w-auto max-w-[78%]" />

          <div className="mt-4 flex flex-col lg:mt-0">
            <h1 className="font-poster text-[2.6rem] font-[850] leading-[0.92] tracking-[-0.02em] [font-stretch:72%] sm:text-[4rem] lg:text-[5.5rem]">
              <span className="block">Fourteen in.</span>
              <span className="block">
                Everyone{" "}
                <span className="inline-block -rotate-[1.5deg] bg-poster-ochre px-2">paid.</span>
              </span>
              <span className="block">
                <span className="text-poster-red">Fair</span> <span className="text-poster-blue">teams.</span>
              </span>
            </h1>
            {/* On phones the ticket comes before the paragraph so it clears the fold. */}
            <p className="order-3 mt-6 max-w-[38ch] text-[18px] leading-relaxed text-ink/80 lg:order-2 lg:text-[20px]">
              Footbolski runs your weekly pickup game: sign-ups with a waitlist, payments on the list,
              and teams split fairly by AI.
            </p>
            <GoogleTicket className="order-2 mt-5 sm:self-start lg:order-3 lg:mt-8" />
          </div>
        </div>
      </header>

      <main>
        {/* Poster two: who's in. */}
        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-8 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-5">
            <h2 className="font-poster text-[2.4rem] font-[850] leading-[0.95] [font-stretch:75%] lg:text-[3.5rem]">
              The list fills itself.
            </h2>
            <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-ink/80">
              Players tap in from the app or straight from a WhatsApp invite. When the fourteen spots
              are taken, new names wait in line, and the first one moves up the moment someone drops
              out. Nobody has to ask the group chat who&rsquo;s still coming.
            </p>
          </div>

          <div className="lg:col-span-7 lg:pl-6">
            <div className="grid grid-cols-7 gap-x-2 gap-y-3 sm:gap-x-4">
              {Array.from({ length: SPOTS }, (_, i) => (
                <Bib key={i} number={i + 1} state="taken" className="w-full" />
              ))}
            </div>
            <div className="mt-6 flex items-end gap-4">
              <p className="pb-1 font-poster text-lg font-extrabold [font-stretch:80%]">Waiting</p>
              <Bib number={15} state="waiting" className="w-10 -rotate-6 sm:w-12" />
              <Bib number={16} state="waiting" className="w-10 rotate-3 sm:w-12" />
            </div>
            <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-ink pt-3">
              <p className="font-semibold tabular-nums">14 of 14 in · 2 waiting</p>
              <Sample>Sample list</Sample>
            </div>
          </div>
        </section>

        {/* Poster three: who's paid. Ochre is money, so the whole field is ochre. */}
        <section className="bg-poster-ochre">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-8 lg:grid-cols-12 lg:py-28">
            <div className="lg:col-span-6">
              <h2 className="font-poster text-[2.4rem] font-[850] leading-[0.95] [font-stretch:75%] lg:text-[3.5rem]">
                Everyone knows what they owe.
              </h2>
              <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-ink/85">
                The price, who to pay and how (BLIK, Revolut or bank transfer) sit right on the match.
                The list shows who has paid, and on match morning anyone who hasn&rsquo;t gets a
                reminder.
              </p>
            </div>

            <div className="lg:col-span-6">
              <p className="font-poster text-[5.5rem] font-black leading-none tracking-[-0.03em] tabular-nums [font-stretch:70%] sm:text-[7.5rem] lg:text-[9rem]">
                28.50 zł
              </p>
              <p className="mt-3 inline-flex items-center gap-3 border-2 border-ink px-3 py-2 font-semibold tabular-nums">
                <span>BLIK</span>
                <span aria-hidden="true" className="h-4 w-px bg-ink" />
                <span>600 ••• 200</span>
              </p>
              <div
                className="mt-8 grid grid-cols-[repeat(14,minmax(0,1.5rem))] gap-1.5"
                aria-label={`${PAID_SAMPLE} of ${SPOTS} paid`}
                role="img"
              >
                {Array.from({ length: SPOTS }, (_, i) => (
                  <span
                    key={i}
                    className={`aspect-square w-full rounded-full border-2 border-ink ${i < PAID_SAMPLE ? "bg-ink" : ""}`}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <p className="font-semibold tabular-nums">12 paid · 2 to go</p>
                <Sample className="text-ink/75">Sample match</Sample>
              </div>
            </div>
          </div>
        </section>

        {/* Poster four: fair teams. The page itself splits into the two colours. */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <h2 className="font-poster text-[2.4rem] font-[850] leading-[0.95] [font-stretch:75%] lg:text-[3.5rem]">
              Teams nobody argues with.
            </h2>
            <p className="mt-5 max-w-[56ch] text-[17px] leading-relaxed text-ink/80">
              Claude weighs everyone&rsquo;s skill, position, stamina and build, keeps the keepers
              apart, and explains its thinking. Then fine-tune the formation on the pitch.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-7xl sm:grid-cols-2 sm:px-8">
            {[
              { name: "Reds", players: REDS, bg: "bg-poster-red" },
              { name: "Blues", players: BLUES, bg: "bg-poster-blue" }
            ].map((team) => (
              <div key={team.name} className={`${team.bg} px-6 py-7 text-paper sm:px-8`}>
                <h3 className="font-poster text-3xl font-black [font-stretch:80%]">{team.name}</h3>
                <ul className="mt-4 divide-y divide-paper/30">
                  {team.players.map(([player, position]) => (
                    <li key={player} className="flex items-baseline justify-between py-2 text-[17px] font-semibold">
                      <span>{player}</span>
                      <span className="text-sm font-bold tracking-wide">{position}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <figure className="mx-auto mt-8 max-w-7xl px-4 sm:px-8">
            <blockquote className="max-w-[60ch] text-[19px] font-medium leading-relaxed">
              &ldquo;Kuba and Paweł both prefer goal, so they start on opposite sides. Each team has
              two at the back and pace up front, and overall strength is level.&rdquo;
            </blockquote>
            <figcaption className="mt-2">
              <Sample>Claude&rsquo;s reasoning, sample split</Sample>
            </figcaption>
          </figure>
        </section>

        {/* Poster five: the proof, live. */}
        <section className="on-dark bg-ink text-paper">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8 lg:py-28">
            <LiveNumbers />
            <p className="mt-6 text-[15px] text-paper/75">
              Live from the Kraków group, updated after every match.
            </p>
          </div>
        </section>

        {/* Poster six: the close. */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8 lg:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <SplitBall still className="w-40 lg:col-span-3 lg:w-full lg:max-w-[260px]" />
            <div className="lg:col-span-9">
              <h2 className="font-poster text-[2.9rem] font-[850] leading-[0.92] [font-stretch:72%] lg:text-[5rem]">
                Bring your group.
              </h2>
              <GoogleTicket className="mt-8 sm:inline-block" label="Set up your game" />
              <div className="mt-4">
                <MemberLink />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink pt-5 text-[15px]">
          <p className="font-poster text-lg font-black [font-stretch:85%]">FOOTBOLSKI</p>
          <nav className="flex items-center gap-6" aria-label="Legal">
            <Link to="/terms" className="tap-target inline-flex items-center underline underline-offset-[0.25em]">
              Terms
            </Link>
            <p className="text-ink/70">Made in Kraków</p>
          </nav>
        </div>
      </footer>
    </div>
  );
}
