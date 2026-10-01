// Quick questions shared by the landing page, the chat's helper bar and the
// "more questions" drawer. Each one is routed by the agent in lib/agent.ts.

export const quickQuestions = {
  Me: 'Who are you? I want to know more about you.',
  Projects: 'What have you built? Show me your projects.',
  Skills: "What are your skills? What's your stack?",
  Fun: 'What do you do for fun? Tell me about the gym.',
  Contact: 'How can I reach you?',
} as const

export type QuickKey = keyof typeof quickQuestions

export const quickConfig: { key: QuickKey; color: string }[] = [
  { key: 'Me', color: '#329696' },
  { key: 'Projects', color: '#3E9858' },
  { key: 'Skills', color: '#856ED9' },
  { key: 'Fun', color: '#B95F9D' },
  { key: 'Contact', color: '#C19433' },
]

// highlighted (dark) rows in the drawer
export const specialQuestions = [
  'Try the AI trainer demo',
  'What are you building lately?',
  'Can I see your résumé?',
]

export const questionsByCategory: { id: string; name: string; questions: string[] }[] = [
  {
    id: 'me',
    name: 'Me',
    questions: ['Who are you?', 'What are you looking for?', 'How was this site built?'],
  },
  {
    id: 'professional',
    name: 'Professional',
    questions: [
      'Can I see your résumé?',
      'Where have you worked?',
      "What's your education?",
      'What do people say about you?',
    ],
  },
  {
    id: 'projects',
    name: 'Projects',
    questions: ['What have you built?', 'What are you building lately?', 'What have you written?'],
  },
  {
    id: 'skills',
    name: 'Skills',
    questions: ["What's your stack?"],
  },
  {
    id: 'fun',
    name: 'Fun',
    questions: ['Tell me about the gym', 'Try the AI trainer demo'],
  },
  {
    id: 'contact',
    name: 'Contact & Future',
    questions: ['How can I reach you?'],
  },
]
