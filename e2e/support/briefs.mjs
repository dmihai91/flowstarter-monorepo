/**
 * Briefs for the quality-review batch: a spread of industries, tones and
 * languages, so a single run shows how the pipeline behaves across the
 * catalogue rather than on one favourable case.
 *
 * Each brief is intake-only (no social scrape), which keeps the batch
 * reproducible and cheap to re-run.
 */
export const BRIEFS = [
  {
    key: 'therapy-en',
    name: 'Marsh & Fern Counselling',
    niche: 'Trauma-informed counselling for adults',
    location: 'Bristol, United Kingdom',
    audience: 'Adults working through anxiety, burnout and life transitions',
    goal: 'Book a free intro call',
    locale: 'en-GB',
    description:
      'A solo counsellor offering in-person and online sessions. Warm, calm, ' +
      'unhurried; never clinical or salesy. Real services only: individual ' +
      'therapy, an intro call, and online sessions. Do not invent client ' +
      'testimonials, outcomes, statistics or accreditations.',
    answers: [
      'I work with adults one to one, in person in Bristol and online. Most people come to me after months of holding it together.',
      'Sessions are 50 minutes, weekly to start. I offer a free 20-minute intro call first so we can see if we fit.',
      'My approach is trauma-informed and paced by the client. I do not push people to relive things before they are ready.',
    ],
  },
  {
    key: 'plumber-en',
    name: 'Halston & Sons Plumbing',
    niche: 'Emergency plumbing and heating',
    location: 'Leeds, United Kingdom',
    audience: 'Homeowners and landlords with urgent leaks and boiler faults',
    goal: 'Phone calls and same-day callouts',
    locale: 'en-GB',
    description:
      'A family plumbing firm. Plain-spoken, practical, no jargon and no ' +
      'hype. Real services: emergency callouts, boiler repair and servicing, ' +
      'bathroom installation. Do not invent reviews, ratings, prices, ' +
      'certifications or years in business beyond what is stated here.',
    answers: [
      'We do emergency callouts, boiler repairs and servicing, and full bathroom installs.',
      'Most calls are leaks and boilers that stopped overnight. We aim to be there the same day.',
      'We quote before we start, and we tell people when a repair is not worth it.',
    ],
  },
  {
    key: 'bakery-ro',
    name: 'Brutăria Cuptorul Vechi',
    niche: 'Brutărie artizanală cu maia',
    location: 'Brașov, România',
    audience: 'Oameni din cartier care vor pâine adevărată',
    goal: 'Vizite în magazin și comenzi pentru evenimente',
    locale: 'ro-RO',
    description:
      'Brutărie artizanală de cartier. TOT conținutul vizibil trebuie scris ' +
      'în limba română, inclusiv meniul, butoanele și subsolul. Ton cald, ' +
      'simplu, fără superlative. Produse reale: pâine cu maia, croissante, ' +
      'cozonac la comandă. Nu inventa recenzii, premii, cifre sau prețuri.',
    answers: [
      'Facem pâine cu maia, fermentată lent, coaptă dimineața devreme.',
      'Avem croissante și foietaje la sfârșit de săptămână, iar cozonacul se face doar la comandă.',
      'Lucrăm cu făină de la o moară din apropiere și nu folosim amelioratori.',
    ],
  },
  {
    key: 'consultancy-en',
    name: 'Ridgeline Operations',
    niche: 'Operations consulting for small manufacturers',
    location: 'Manchester, United Kingdom',
    audience: 'Owner-managers of 10-80 person manufacturing businesses',
    goal: 'Book a working session',
    locale: 'en-GB',
    description:
      'An independent operations consultant. Direct, evidence-led, sceptical ' +
      'of buzzwords. Real services: a diagnostic review, a fixed-scope ' +
      'improvement project, and ongoing advisory. Do not invent client ' +
      'names, case studies, percentages, savings figures or awards.',
    answers: [
      'I start with a diagnostic: two days on the floor, then a written view of where the time and money actually go.',
      'Then a fixed-scope project, usually eight to twelve weeks, with the client team doing the work and me steering.',
      'I do not sell software and I do not leave a slide deck behind. The output is a changed process people follow.',
    ],
  },
];
