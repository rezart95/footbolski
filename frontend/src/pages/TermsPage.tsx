import { PageHeader } from "../components/ui/PageHeader";
import { TERMS_EFFECTIVE_DATE, TERMS_SECTIONS } from "../content/terms";

/** The full Terms and Conditions, linked from the acceptance step and readable at
 * any time. Acceptance happens during name entry, so this page is read-only.
 * Set for reading: one column at a comfortable measure, numbered clauses, rules
 * between sections instead of boxes. */
export function TermsPage() {
  return (
    <article className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div>
        <PageHeader title="Terms and Conditions" />
        <p className="mt-3 text-[15px] font-semibold text-fg/75">In effect from {TERMS_EFFECTIVE_DATE}</p>
      </div>

      <div>
        {TERMS_SECTIONS.map((section) => (
          <section className="grid gap-3 border-b border-fg/25 py-6 first:pt-0" key={section.number}>
            <h2 className="flex items-baseline gap-3">
              <span className="t-numeral w-8 shrink-0 text-[2rem]">{section.number}</span>
              <span className="t-title text-[1.4rem]">{section.heading}</span>
            </h2>
            {section.body.map((paragraph, index) => (
              <p className="max-w-[65ch] pl-11 text-[17px] leading-relaxed text-fg/85" key={`${section.number}-${index}`}>
                <span className="mr-2 text-[13px] font-semibold tabular-nums text-fg/65">
                  {section.number}.{index + 1}
                </span>
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      <p className="text-[15px] leading-relaxed text-fg/75">
        These Terms are made available in English. Should you require any clause explained, please ask the organiser.
      </p>
    </article>
  );
}
