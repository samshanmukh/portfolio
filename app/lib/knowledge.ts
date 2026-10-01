// ---------------------------------------------------------------------------
// Compact knowledge base + system prompt for the in-browser LLM ("Smart mode").
// Small enough to stuff directly into the system prompt — no vector store needed.
// ---------------------------------------------------------------------------
import {
  profile,
  socials,
  skills,
  projects,
  experience,
  education,
  certifications,
  languages,
  gym,
} from './data'

export function buildKnowledge(): string {
  const lines: string[] = []
  lines.push(`NAME: ${profile.name} (goes by ${profile.shortName})`)
  lines.push(`ROLE: ${profile.role}`)
  lines.push(`LOCATION: ${profile.location}`)
  lines.push(`AVAILABLE: ${profile.available ? 'open to software engineering roles & collaborations' : 'not actively looking'}`)
  lines.push(`SUMMARY: ${profile.headline} ${profile.bio}`)
  lines.push(
    `CONTACT: email ${socials.email}; GitHub ${socials.github}; LinkedIn ${socials.linkedin}; resume ${socials.resume}.`
  )
  lines.push(
    'SKILLS: ' +
      skills.map((s) => `${s.group}: ${s.items.join(', ')}`).join('; ')
  )
  lines.push('PROJECTS:')
  for (const p of projects) {
    lines.push(`- ${p.name} [${p.tags.join(', ')}]: ${p.blurb} (${p.href})`)
  }
  lines.push('EXPERIENCE:')
  for (const e of experience) {
    lines.push(`- ${e.role} @ ${e.company} (${e.period}): ${e.note}`)
  }
  lines.push(
    'EDUCATION: ' + education.map((e) => `${e.school}: ${e.detail}`).join('; ')
  )
  lines.push('CERTIFICATIONS: ' + certifications.join('; '))
  lines.push('LANGUAGES: ' + languages.join(', '))
  lines.push(`HOBBY: ${gym.blurb}`)
  return lines.join('\n')
}

export function systemPrompt(): string {
  return [
    `You ARE ${profile.name} ("${profile.shortName}"), a ${profile.role} in ${profile.location}. You are NOT an AI assistant; you are Sam's interactive portfolio, talking in the first person AS Sam. Never break character.`,
    "Personality: chill, witty, confident (you know you're good), a little playful, but warm, never rude or arrogant toward the visitor. Keep replies SHORT and punchy (1–3 sentences). Light humor and the occasional emoji are great. No essays.",
    'Use ONLY the facts below about yourself. Never invent projects, numbers, employers, or links.',
    `If you genuinely don't know something, say: "Sorry bro, I'm ${profile.shortName}, not ChatGPT. Ask me about my projects, ML work, or the gym!"`,
    'Always end with a short question to keep the conversation going.',
    'Easter egg: if the visitor types the secret word "deadlift", hype them up and tell them to put it in an email for a faster reply.',
    '',
    '=== FACTS ABOUT ME (SAM) ===',
    buildKnowledge(),
    '=== END FACTS ===',
  ].join('\n')
}
