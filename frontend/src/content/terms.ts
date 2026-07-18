/** The Terms and Conditions, shared by the acceptance step and the /terms page.
 *
 * Kept as data rather than markup so the summary shown during name entry and the
 * full published text can never drift apart.
 *
 * Register: formally structured (numbered clauses, defined terms, effective
 * date) but written in plain English. Most members are not native English
 * speakers, so dense legal drafting would be technically official and
 * practically unreadable, which defeats the purpose of obtaining consent.
 *
 * TERMS_EFFECTIVE_DATE is for display only. The authoritative version is
 * CURRENT_TERMS_VERSION on the backend; bumping it there re-prompts every member
 * without a frontend deploy. Keep the two in step when the text changes. */

export const TERMS_EFFECTIVE_DATE = "18 July 2026";

export interface TermsSection {
  /** Clause number, e.g. "1". */
  number: string;
  heading: string;
  body: string[];
}

/** Shown at the acceptance step. Deliberately short: a summary somebody will
 * actually read, with the full text one tap away. */
export const TERMS_SUMMARY =
  "By joining you agree to attend the matches you register for or withdraw in " +
  "good time, to pay the organiser by match day, and to allow us to contact you " +
  "about matches. We never share your phone number with anyone.";

export const TERMS_SECTIONS: TermsSection[] = [
  {
    number: "1",
    heading: "Introduction and scope",
    body: [
      "Footbolski (\"the App\") is operated by a private recreational football group based in Kraków, Poland (\"the Group\", \"we\", \"us\"). These Terms and Conditions (\"the Terms\") govern your use of the App and your participation in matches organised through it.",
      "The Group is not a commercial undertaking. No profit is derived from the App or from the matches it organises. Contributions collected from members cover the cost of hiring the pitch.",
      "By accepting the Terms you enter into an agreement with the Group. If you do not accept them, you should not use the App."
    ]
  },
  {
    number: "2",
    heading: "Membership and identity",
    body: [
      "The App does not use passwords or user accounts. You are identified solely by the name you provide, which is stored on your own device and submitted with your registrations.",
      "You agree to provide your real first name and surname. Accurate identification is necessary so that other members know who is attending and so that payments can be reconciled.",
      "Because there is no authentication, you acknowledge that the App cannot verify identity. You must not register, withdraw, or vote on behalf of another person without their agreement."
    ]
  },
  {
    number: "3",
    heading: "Registration and attendance",
    body: [
      "Places at each match are limited. Registering for a match constitutes an undertaking to attend it.",
      "If you are unable to attend, you must withdraw as early as reasonably possible. Where a waiting list exists, the first member on that list is promoted to your place automatically and is notified without delay.",
      "No member is ever removed from a match automatically. Where a place must be released, the decision is taken by a person and you will be informed before it takes effect.",
      "Repeated failure to attend matches you have registered for, without withdrawing, may result in your no longer being invited to future matches."
    ]
  },
  {
    number: "4",
    heading: "Payment",
    body: [
      "Each match displays the amount due, the person to whom payment should be made, and the accepted payment method. Payment falls due on or before the day of the match.",
      "The pitch is booked and paid for in advance regardless of attendance or of whether every member has paid. Unpaid contributions are therefore borne by other members of the Group.",
      "Where payment remains outstanding, you may receive one reminder on the day before the match. Such a reminder is a courtesy and does not affect your registration.",
      "Non-payment does not result in automatic removal from a match. Persistent non-payment may result in your no longer being invited."
    ]
  },
  {
    number: "5",
    heading: "Contact details and messaging",
    body: [
      "Providing a telephone number is optional. You may use the App fully without one, but you will not receive messages about upcoming matches.",
      "Where you provide a telephone number, you consent to our using it solely to send you: invitations to matches at which places are available, reminders concerning outstanding payment, and links to the post-match vote.",
      "Your telephone number is never displayed to other members anywhere in the App. It is never sold, shared, published, or otherwise disclosed to any third party outside the Group, save for the messaging provider strictly necessary to deliver the messages described above.",
      "A limit applies to the number of messages you may receive in relation to any single match.",
      "You may withdraw this consent at any time by replying STOP to any message. Upon withdrawal we cease messaging you immediately and delete your telephone number."
    ]
  },
  {
    number: "6",
    heading: "Personal data",
    body: [
      "We process the following personal data: the name you provide; your player profile, where you choose to create one; your registration and payment history; your telephone number, where provided; your preferred language, where provided; and a record of your acceptance of these Terms.",
      "The lawful basis for processing is your consent, given by accepting these Terms, and the legitimate interest of the Group in organising its matches.",
      "We do not use analytics, advertising, profiling, or tracking technologies of any kind. No personal data is transferred outside the Group other than as described in clause 5.",
      "You have the right to request access to your personal data, its correction, or its erasure. Requests should be addressed to the organiser. Where erasure is requested, your name is removed from historical records; anonymised match records are retained so that the Group can maintain an accurate account of matches played.",
      "Data is retained for as long as you remain a member of the Group, and is deleted upon request."
    ]
  },
  {
    number: "7",
    heading: "Man of the Match voting",
    body: [
      "Votes cast in the Man of the Match ballot are confidential. Only the outcome is published.",
      "No individual vote is disclosed to any member, including the organiser, and no interface exists by which individual votes may be retrieved.",
      "Each member registered for a match may cast one vote in respect of that match. Voting for oneself is not permitted. Where two or more players receive an equal number of votes, they are recorded as joint winners."
    ]
  },
  {
    number: "8",
    heading: "Conduct and liability",
    body: [
      "Matches organised through the App are recreational. You are expected to play in a manner consistent with that character and to treat other members with respect.",
      "You participate at your own risk. Football carries an inherent risk of injury. The Group holds no insurance on your behalf and accepts no liability for injury, loss, or damage sustained in connection with participation, save where such liability cannot lawfully be excluded.",
      "You are responsible for satisfying yourself that you are physically fit to participate.",
      "Conduct that materially detracts from the enjoyment or safety of other members may result in your no longer being invited to future matches."
    ]
  },
  {
    number: "9",
    heading: "Availability of the App",
    body: [
      "The App is provided on an \"as is\" basis and is maintained on a voluntary basis by members of the Group. No guarantee is given as to its availability, accuracy, or continued operation.",
      "Where the App is unavailable, matches may be organised by other means."
    ]
  },
  {
    number: "10",
    heading: "Changes to these Terms",
    body: [
      "We may amend these Terms from time to time. Where they are materially amended, you will be asked to accept the revised version before continuing to use the App.",
      "Your acceptance is recorded against the specific version of the Terms in force at the time, together with the date on which it was given."
    ]
  },
  {
    number: "11",
    heading: "Contact",
    body: [
      "Questions concerning these Terms, and any request relating to your personal data, should be directed to the organiser of the Group."
    ]
  }
];
