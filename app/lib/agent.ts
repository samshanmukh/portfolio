// ---------------------------------------------------------------------------
// Portfolio agent "brain" — maps a natural-language question to a structured
// answer built from lib/data.ts. Powers the chat on the homepage.
// ---------------------------------------------------------------------------
import {
  profile,
  socials,
  skills,
  projects,
  experience,
  education,
  gym,
  testimonials,
} from './data'

export type Source = { label: string; href?: string; scrollTo?: string }
export type AgentReply = {
  tool: string // shown as a "tool call" chip, e.g. search(projects)
  text: string // the streamed answer
  sources?: Source[]
  action?: 'resume' | 'email' | 'source'
  scrollTo?: string
  followups?: string[] // contextual suggestion chips after the answer
}

export const SUGGESTIONS = [
  'What has he built?',
  'Where has he worked?',
  "What's his stack?",
  'How do I reach him?',
]

const has = (q: string, ...keys: string[]) => keys.some((k) => q.includes(k))

export function ask(question: string): AgentReply {
  const q = question.toLowerCase().trim()

  if (!q || has(q, 'help', 'what can you', 'who are you')) {
    return {
      tool: 'init()',
      text: `I'm ${profile.shortName}'s portfolio agent. Ask me about his projects, experience, skills, or how to reach him — or tap a suggestion below.`,
    }
  }

  // greeting
  if (/^(hi|hey|hello|yo|sup|howdy|hiya)\b/.test(q)) {
    return {
      tool: 'init()',
      text: `Hey! I'm ${profile.shortName}'s portfolio agent. Want to hear about his projects, experience, or how to reach him?`,
      followups: SUGGESTIONS,
    }
  }

  // what is he looking for / availability
  if (has(q, 'looking for', 'looking', 'available', 'remote', 'relocat', 'onsite', 'on-site', 'visa', 'sponsor')) {
    return {
      tool: 'read(status)',
      text: `${profile.lookingFor}. He's actively open and usually replies within a day.`,
      followups: ['How do I reach him?', 'View his résumé', 'What has he built?'],
      sources: [{ label: 'email', href: `mailto:${socials.email}` }],
    }
  }

  // projects
  if (has(q, 'build', 'built', 'project', 'ship', 'work on', 'made', 'portfolio of', 'agent', 'model', 'favorite', 'best')) {
    const featured = projects.filter((p) => p.featured)
    const text =
      `Sam ships applied AI end-to-end. The headliner is ${featured[0].name} — ${featured[0].blurb.toLowerCase()} ` +
      `He's also built ${featured
        .slice(1)
        .map((p) => p.name)
        .join(' and ')}, plus computer-vision and quant tools. Tap a source to dig in.`
    return {
      tool: 'search(projects)',
      text,
      scrollTo: 'projects',
      sources: projects.slice(0, 4).map((p) => ({ label: p.name, href: p.href })),
      followups: ["What's his stack?", 'Where has he worked?', 'How do I reach him?'],
    }
  }

  // experience
  if (has(q, 'experience', 'work', 'worked', 'job', 'career', 'company', 'companies', 'history', 'role')) {
    const cur = experience[0]
    const text =
      `Sam has 8+ years across data science and ML engineering. Currently ${cur.role} at ${cur.company} (${cur.period}), ` +
      `building RAG chatbots and computer-vision pipelines. Before that: ${experience
        .slice(1, 3)
        .map((e) => e.company)
        .join(', ')}, and more — see the timeline.`
    return {
      tool: 'query(experience)',
      text,
      scrollTo: 'experience',
      sources: experience.slice(0, 3).map((e) => ({ label: e.company, scrollTo: 'experience' })),
      followups: ['What has he built?', "What's his education?", 'What do people say?'],
    }
  }

  // skills / stack
  if (has(q, 'skill', 'stack', 'tech', 'tool', 'language', 'framework', 'know', 'use')) {
    const text =
      `His toolkit spans ${skills[0].items.slice(0, 4).join(', ')} on the AI side, ` +
      `${skills[1].items.slice(0, 4).join(', ')} for data, and ships with ${skills[2].items
        .slice(0, 3)
        .join(', ')}. Full breakdown below.`
    return {
      tool: 'read(skills.json)',
      text,
      scrollTo: 'about',
      followups: ['What has he built?', 'Where has he worked?'],
    }
  }

  // testimonials / recommendations
  if (has(q, 'recommend', 'testimonial', 'people say', 'say about', 'reference', 'vouch', 'review', 'what do people')) {
    const t = testimonials[0]
    return {
      tool: 'fetch(recommendations)',
      text: `People love working with him. ${t.name} (${t.title}) said: “${t.quote}”`,
      scrollTo: 'testimonials',
      followups: ['What has he built?', 'How do I reach him?'],
    }
  }

  // education
  if (has(q, 'education', 'degree', 'study', 'studied', 'school', 'university', 'college', 'masters', 'phd')) {
    const text = `${education
      .map((e) => `${e.school} — ${e.detail}`)
      .join('. ')}.`
    return { tool: 'query(education)', text, scrollTo: 'experience' }
  }

  // contact / hire
  if (has(q, 'reach', 'contact', 'email', 'hire', 'hiring', 'connect', 'touch', 'message', 'available', 'open to')) {
    return {
      tool: 'open(contacts)',
      text: `Easiest is email — ${socials.email}. He's open to ML/AI roles and collaborations, and usually replies within a day. Links below.`,
      scrollTo: 'contact',
      sources: [
        { label: 'email', href: `mailto:${socials.email}` },
        { label: 'linkedin', href: socials.linkedin },
        { label: 'github', href: socials.github },
      ],
      followups: ['View his résumé', 'What has he built?', 'What do people say?'],
    }
  }

  // resume
  if (has(q, 'resume', 'cv', 'résumé')) {
    return {
      tool: 'fetch(resume.pdf)',
      text: 'Opening his résumé now — it has the full detail on roles, dates, and stack.',
      action: 'resume',
      sources: [{ label: 'resume.pdf', href: socials.resume }],
      followups: ['Where has he worked?', 'How do I reach him?'],
    }
  }

  // gym / hobby
  if (has(q, 'gym', 'hobby', 'fun', 'outside', 'lift', 'workout', 'fitness', 'free time', 'personal')) {
    return {
      tool: 'run(gym.sh)',
      text: `${gym.blurb} It's literally why he built RepRight and VoiceCoach — AI coaches for the gym.`,
      scrollTo: 'gym',
    }
  }

  // how the site was built
  if (has(q, 'this site', 'this website', 'built this', 'how built', 'source', 'code of', 'made this', 'tech of this')) {
    return {
      tool: 'cat(build.txt)',
      text: 'This whole site is hand-coded from scratch — Next.js, React, TypeScript, Tailwind. No template, no page builder. I (this agent) am part of it. Source is public.',
      action: 'source',
      sources: [{ label: 'view source', href: socials.sourceRepo }],
    }
  }

  // who / about
  if (has(q, 'who', 'about', 'bio', 'background', 'tell me', 'sam', 'sanmukh', 'himself')) {
    return {
      tool: 'read(bio)',
      text: `${profile.name} — ${profile.role} in ${profile.location}. ${profile.headline}`,
      scrollTo: 'about',
    }
  }

  // fallback
  return {
    tool: 'no_match',
    text: `I can tell you about Sam's projects, experience, skills, education, recommendations, or how to reach him. Try one of these:`,
    followups: SUGGESTIONS,
  }
}
