// Single source of truth for the page's narrative chapters. Shared by the
// chapter rail (side navigation) and the guided tour (auto-scroll + narration).
// `id` must match the corresponding <section id="…"> on the home page.

export type Chapter = {
  id: string
  no: string // rail number; '' = unnumbered beat (hidden from the numbered rail)
  label: string
  narration: string // first-person, spoken AS Sam during the guided tour
}

export const chapters: Chapter[] = [
  {
    id: 'ask',
    no: '00',
    label: 'Ask my agent',
    narration:
      "This is my deployed agent — it knows my whole story, so ask it anything, anytime.",
  },
  {
    id: 'approach',
    no: '01',
    label: 'How I work',
    narration:
      'Here’s how I work: I embed with the team, ship to production, and own what happens after.',
  },
  {
    id: 'projects',
    no: '02',
    label: 'Selected work',
    narration:
      'A few problems I took all the way to production — each one’s the problem, my move, and the outcome.',
  },
  {
    id: 'trainer',
    no: '03',
    label: 'Proof, live',
    narration:
      'Proof I deploy, not just pitch — turn on your camera and this coaches your squats in real time.',
  },
  {
    id: 'experience',
    no: '04',
    label: 'Field log',
    narration:
      'Six-plus years of embedding with teams and shipping ML the last mile, into production.',
  },
  {
    id: 'testimonials',
    no: '05',
    label: 'What teams say',
    narration:
      'Don’t take my word for it — here’s what the people I actually shipped alongside say.',
  },
  {
    id: 'gym',
    no: '06',
    label: 'Beyond code',
    narration:
      'And the human side — the gym, which is exactly why half my side projects are AI coaches.',
  },
  {
    id: 'contact',
    no: '07',
    label: 'Contact',
    narration:
      'That’s the tour. If you’ve got a problem worth embedding on, let’s build something.',
  },
]
