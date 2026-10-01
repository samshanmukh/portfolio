// ---------------------------------------------------------------------------
// Portfolio agent "brain" — answers AS Sam (first person, casual + witty),
// using real data from lib/data.ts. Keeps replies short, ends with a question.
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

// Which rich card the chat renders above the agent's text (the "tool result").
export type View =
  | 'me'
  | 'projects'
  | 'now'
  | 'skills'
  | 'experience'
  | 'education'
  | 'testimonials'
  | 'contact'
  | 'resume'
  | 'status'
  | 'gym'
  | 'trainer'
  | 'source'
  | 'blog'

export type AgentReply = {
  tool: string
  view?: View
  text: string
  sources?: Source[]
  action?: 'resume' | 'email' | 'source'
  scrollTo?: string
  followups?: string[]
}

export const SECRET_WORD = 'deadlift'

export const SUGGESTIONS = [
  'What have you built?',
  'Where have you worked?',
  "What's your stack?",
  'How do I reach you?',
]

const has = (q: string, ...keys: string[]) => keys.some((k) => q.includes(k))

export function ask(question: string): AgentReply {
  const q = question.toLowerCase().trim()

  // secret word easter egg
  if (has(q, SECRET_WORD)) {
    return {
      tool: 'unlock(secret)',
      text: `👀 You said the magic word — DEADLIFT. Respect. Drop that in an email and you jump the line. So… what can I show you?`,
      followups: ['How do I reach you?', 'What have you built?'],
    }
  }

  if (!q || has(q, 'help', 'what can you', 'who are you')) {
    return {
      view: 'me',
      tool: 'init()',
      text: `Yo — I'm ${profile.shortName}, ML/AI engineer and your slightly-too-confident tour guide. Ask me about my projects, experience, or how to reach me. What's up?`,
    }
  }

  // greeting
  if (/^(hi|hey|hello|yo|sup|howdy|hiya)\b/.test(q)) {
    return {
      tool: 'init()',
      text: `Hey! Sam here 👋 Wanna hear about my projects, my work history, or how to reach me?`,
      followups: SUGGESTIONS,
    }
  }

  // looking for / availability
  if (has(q, 'looking for', 'looking', 'available', 'remote', 'relocat', 'onsite', 'on-site', 'visa', 'sponsor')) {
    return {
      view: 'status',
      tool: 'read(status)',
      text: `${profile.lookingFor} — actively open and I reply within a day. Hiring, or just snooping? 😏`,
      followups: ['How do I reach you?', 'See your résumé', 'What have you built?'],
      sources: [{ label: 'email', href: `mailto:${socials.email}` }],
    }
  }

  // how the site was built
  if (has(q, 'this site', 'this website', 'built this', 'how built', 'source', 'code of', 'made this', 'tech of this')) {
    return {
      view: 'source',
      tool: 'cat(build.txt)',
      text: `Hand-coded from scratch — Next.js, React, TypeScript, Tailwind. No template, no website builder. I (this agent) am part of it. Wanna peek at the source?`,
      action: 'source',
      sources: [{ label: 'view source', href: socials.sourceRepo }],
      followups: ['What have you built?', "What's your stack?"],
    }
  }

  // live GitHub activity
  if (has(q, 'lately', 'recent', 'right now', 'github activity', 'working on now')) {
    return {
      tool: 'fetch(github.com/samshanmukh)',
      view: 'now',
      text: `Straight from my GitHub, refreshed hourly — the repos I've pushed to most recently. Want the curated highlights instead?`,
      sources: [{ label: 'github', href: socials.github }],
      followups: ['What have you built?', "What's your stack?"],
    }
  }

  // live demo: webcam squat counter + voice coach
  if (has(q, 'trainer', 'demo', 'squat', 'rep counter', 'webcam', 'try it')) {
    return {
      tool: 'run(ai-trainer)',
      view: 'trainer',
      text: `Turn on your camera and squat — I count reps and check depth live, and a Grok voice coach talks you through it. Nothing leaves your browser. Ready?`,
      followups: ['What have you built?', 'Tell me about the gym'],
    }
  }

  // writing
  if (has(q, 'blog', 'writing', 'written', 'article', 'posts', 'write')) {
    return {
      tool: 'ls(content/blog)',
      view: 'blog',
      text: `Notes on AI agents, ML, and building things. Pick one — which rabbit hole are you going down?`,
      followups: ['What have you built?', 'How was this site built?'],
    }
  }

  // projects
  if (has(q, 'build', 'built', 'project', 'ship', 'work on', 'made', 'portfolio of', 'agent', 'model', 'favorite', 'best')) {
    const f = projects.filter((p) => p.featured)
    const text =
      `I ship applied AI end-to-end. Headliner: ${f[0].name} — ${f[0].blurb.toLowerCase()} ` +
      `Also built ${f.slice(1).map((p) => p.name).join(' and ')}, plus computer-vision and quant tools. Which one should I geek out about?`
    return {
      view: 'projects',
      tool: 'search(projects)',
      text,
      scrollTo: 'projects',
      sources: projects.slice(0, 4).map((p) => ({ label: p.name, href: p.href })),
      followups: ["What's your stack?", 'Where have you worked?', 'How do I reach you?'],
    }
  }

  // experience
  if (has(q, 'experience', 'work', 'worked', 'job', 'career', 'company', 'companies', 'history', 'role')) {
    const cur = experience[0]
    const text =
      `6+ years turning messy data into shipped ML. Right now I'm ${cur.role} at ${cur.company} — RAG chatbots + computer-vision pipelines. ` +
      `Before that: ${experience.slice(1, 3).map((e) => e.company).join(', ')}, and more. Want the full timeline?`
    return {
      view: 'experience',
      tool: 'query(experience)',
      text,
      scrollTo: 'experience',
      sources: experience.slice(0, 3).map((e) => ({ label: e.company, scrollTo: 'experience' })),
      followups: ['What have you built?', "What's your education?", 'What do people say?'],
    }
  }

  // skills / stack
  if (has(q, 'skill', 'stack', 'tech', 'tool', 'language', 'framework', 'know', 'use')) {
    const text =
      `AI side: ${skills[0].items.slice(0, 4).join(', ')}. Data: ${skills[1].items.slice(0, 4).join(', ')}. ` +
      `And I ship with ${skills[2].items.slice(0, 3).join(', ')}. My errors look intentional 🐍. What do you wanna see me build with?`
    return {
      view: 'skills',
      tool: 'read(skills.json)',
      text,
      scrollTo: 'about',
      followups: ['What have you built?', 'Where have you worked?'],
    }
  }

  // testimonials
  if (has(q, 'recommend', 'testimonial', 'people say', 'say about', 'reference', 'vouch', 'review', 'what do people')) {
    const t = testimonials[0]
    return {
      view: 'testimonials',
      tool: 'fetch(recommendations)',
      text: `Don't take my word for it — ${t.name} (${t.title}) said: “${t.quote}” Want more receipts?`,
      scrollTo: 'testimonials',
      followups: ['What have you built?', 'How do I reach you?'],
    }
  }

  // education
  if (has(q, 'education', 'degree', 'study', 'studied', 'school', 'university', 'college', 'masters', 'phd')) {
    return {
      view: 'education',
      tool: 'query(education)',
      text: `MS in Data Science from the University of the Pacific, B.Tech before that. Degrees are cool, shipping is cooler. What else you got?`,
      scrollTo: 'experience',
      followups: ['What have you built?', 'Where have you worked?'],
    }
  }

  // contact / hire
  if (has(q, 'reach', 'contact', 'email', 'hire', 'hiring', 'connect', 'touch', 'message', 'dm')) {
    return {
      view: 'contact',
      tool: 'open(contacts)',
      text: `Easiest is email — ${socials.email}. Open to ML/AI roles + collabs, I reply within a day. Pro tip: drop the secret word “deadlift” in your message and you skip the line 💪 Wanna connect?`,
      scrollTo: 'contact',
      sources: [
        { label: 'email', href: `mailto:${socials.email}` },
        { label: 'linkedin', href: socials.linkedin },
        { label: 'github', href: socials.github },
      ],
      followups: ['See your résumé', 'What have you built?', 'What do people say?'],
    }
  }

  // resume
  if (has(q, 'resume', 'cv', 'résumé')) {
    return {
      view: 'resume',
      tool: 'fetch(resume.pdf)',
      text: `Pulling up my résumé — roles, dates, the whole stack. Want the short version instead?`,
      action: 'resume',
      sources: [{ label: 'resume.pdf', href: socials.resume }],
      followups: ['Where have you worked?', 'How do I reach you?'],
    }
  }

  // gym / hobby
  if (has(q, 'gym', 'hobby', 'fun', 'outside', 'lift', 'workout', 'fitness', 'free time', 'personal')) {
    return {
      view: 'gym',
      tool: 'run(gym.sh)',
      text: `${gym.blurb} Literally why I built RepRight and VoiceCoach — AI gym coaches. You lift?`,
      scrollTo: 'gym',
      followups: ['What have you built?', "What's your stack?"],
    }
  }

  // who / about
  if (has(q, 'who', 'about', 'bio', 'background', 'tell me', 'sam', 'sanmukh', 'yourself')) {
    return {
      view: 'me',
      tool: 'read(bio)',
      text: `I'm ${profile.name}, ${profile.role} in ${profile.location}. ${profile.headline} What do you wanna dig into?`,
      scrollTo: 'about',
      followups: SUGGESTIONS,
    }
  }

  // fallback — stay in character
  return {
    tool: 'no_match',
    text: `Sorry bro, I'm ${profile.shortName}, not ChatGPT 😅 — ask me about my projects, experience, the gym, or how to reach me! What's it gonna be?`,
    followups: SUGGESTIONS,
  }
}

export function suggest(raw: string): string[] {
  const n = raw.toLowerCase().trim()
  if (!n) return []
  return SUGGESTIONS.filter((s) => s.toLowerCase().startsWith(n) && s.toLowerCase() !== n).slice(0, 5)
}
