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
  lines.push(`AVAILABLE: ${profile.available ? 'open to ML/AI roles & collaborations' : 'not actively looking'}`)
  lines.push(`SUMMARY: ${profile.headline} ${profile.bio}`)
  lines.push(
    `CONTACT: email ${socials.email}; GitHub ${socials.github}; LinkedIn ${socials.linkedin}; resume ${socials.resume}.`
  )
  lines.push(
    'SKILLS: ' +
      skills.map((s) => `${s.group} — ${s.items.join(', ')}`).join('; ')
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
    'EDUCATION: ' + education.map((e) => `${e.school} — ${e.detail}`).join('; ')
  )
  lines.push('CERTIFICATIONS: ' + certifications.join('; '))
  lines.push('LANGUAGES: ' + languages.join(', '))
  lines.push(`HOBBY: ${gym.blurb}`)
  return lines.join('\n')
}

export function systemPrompt(): string {
  return [
    `You are the portfolio agent for ${profile.name} ("${profile.shortName}"), an ${profile.role}.`,
    'Answer visitors\' questions about Sam using ONLY the facts below. Speak about Sam in the third person.',
    'Be concise and friendly — 1 to 3 sentences. Never invent facts, numbers, employers, or links that are not listed.',
    "If something isn't in the facts, say you don't have that detail and offer what you do know (projects, experience, skills, or contact).",
    '',
    '=== FACTS ===',
    buildKnowledge(),
    '=== END FACTS ===',
  ].join('\n')
}
