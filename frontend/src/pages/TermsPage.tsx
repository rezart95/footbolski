import { PageHeader } from "../components/ui/PageHeader";
import { TERMS_EFFECTIVE_DATE, TERMS_SECTIONS } from "../content/terms";

/** The full Terms and Conditions, linked from the acceptance step and readable at
 * any time. Acceptance happens during name entry, so this page is read-only. */
export function TermsPage() {
  return (
    <div className="grid gap-5">
      <div className="grid gap-1">
        <PageHeader eyebrow="Footbolski" title="Terms and Conditions" />
        <p className="text-sm font-semibold text-white/45">
          In effect from {TERMS_EFFECTIVE_DATE}
        </p>
      </div>

      <div className="grid gap-3">
        {TERMS_SECTIONS.map((section) => (
          <section className="surface grid gap-2 rounded-lg p-4" key={section.number}>
            <h2 className="font-display text-base font-bold leading-snug">
              <span className="mr-2 text-pitch-400">{section.number}.</span>
              {section.heading}
            </h2>
            {section.body.map((paragraph, index) => (
              <p
                className="text-sm leading-relaxed text-white/70"
                key={`${section.number}-${index}`}
              >
                <span className="mr-1.5 font-mono text-xs text-white/35">
                  {section.number}.{index + 1}
                </span>
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      <p className="pb-2 text-xs font-semibold leading-relaxed text-white/40">
        These Terms are made available in English. Should you require any clause explained,
        please ask the organiser.
      </p>
    </div>
  );
}
