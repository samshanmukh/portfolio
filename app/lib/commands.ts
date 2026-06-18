// ---------------------------------------------------------------------------
// Command engine for the interactive terminal. Maps the commands shown across
// the site to live output generated from lib/data.ts.
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

export type CmdResult = {
  /** Output lines to print under the echoed command. */
  lines: string[]
  /** Optional side effects handled by the console component. */
  action?: 'clear' | 'resume' | 'music' | 'email'
  /** Optional element id to scroll into view. */
  scrollTo?: string
  /** Marks an error (unknown command) for styling. */
  error?: boolean
}

// Canonical commands surfaced on the site + a short description (for `help`).
export const COMMANDS: { cmd: string; desc: string }[] = [
  { cmd: 'whoami', desc: 'who I am' },
  { cmd: 'cat role.txt', desc: 'current role & location' },
  { cmd: 'cat bio.txt', desc: 'short bio' },
  { cmd: 'cat skills.json', desc: 'tech I work with' },
  { cmd: 'ls links/', desc: 'social & resume links' },
  { cmd: 'ls -la ~/projects', desc: 'projects I’ve shipped' },
  { cmd: 'git log --oneline --all', desc: 'experience & education' },
  { cmd: './gym.sh --status', desc: 'life outside the terminal' },
  { cmd: './connect.sh', desc: 'how to reach me' },
  { cmd: 'play_soundtrack.sh', desc: 'toggle the soundtrack' },
  { cmd: 'resume.pdf', desc: 'open my résumé' },
  { cmd: 'clear', desc: 'clear the output' },
  { cmd: 'help', desc: 'list commands' },
]

const bullet = '  ›'

function skillsLines(): string[] {
  return skills.map((s) => `  ${s.group.padEnd(16)} ${s.items.join(', ')}`)
}

function projectsLines(): string[] {
  const out: string[] = [`total ${projects.length}`]
  for (const p of projects) {
    out.push(`${bullet} ${p.name}${p.featured ? ' *' : ''}  [${p.tags.join(', ')}]`)
    out.push(`    ${p.blurb}`)
    out.push(`    ${p.href}`)
  }
  return out
}

function experienceLines(): string[] {
  const out: string[] = []
  for (const e of experience) {
    out.push(`${bullet} ${e.role} @ ${e.company}  (${e.period})`)
    out.push(`    ${e.note}`)
  }
  out.push('')
  out.push('education:')
  for (const ed of education) out.push(`${bullet} ${ed.school} — ${ed.detail}`)
  out.push('')
  out.push(`certs: ${certifications.length} (run \`cat certs.txt\`)`)
  out.push(`languages: ${languages.join(', ')}`)
  return out
}

function gymLines(): string[] {
  return [
    `# ${gym.tagline}`,
    gym.blurb,
    '',
    ...gym.stats.map((s) => `${bullet} ${s.label.padEnd(16)} ${s.value}`),
  ]
}

function contactLines(): string[] {
  return [
    `${bullet} email     ${socials.email}`,
    `${bullet} github    ${socials.github}`,
    `${bullet} linkedin  ${socials.linkedin}`,
    `${bullet} twitter   ${socials.twitter}`,
    '',
    "type `email` to open your mail client.",
  ]
}

function helpLines(): string[] {
  return [
    'available commands:',
    ...COMMANDS.map((c) => `${bullet} ${c.cmd.padEnd(26)} ${c.desc}`),
    '',
    'aliases: about, skills, projects, experience, gym, contact, email …',
  ]
}

// Normalize a raw command: trim, collapse whitespace, lowercase.
function norm(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').toLowerCase()
}

// Map of normalized command (and aliases) → result producer.
const TABLE: Record<string, () => CmdResult> = {}
const reg = (keys: string[], make: () => CmdResult) =>
  keys.forEach((k) => (TABLE[norm(k)] = make))

reg(['help', '?', 'commands', 'man'], () => ({ lines: helpLines() }))
reg(['whoami', 'who'], () => ({ lines: [profile.name] }))
reg(['cat role.txt', 'role'], () => ({
  lines: [`${profile.role} · ${profile.location}`],
}))
reg(['cat bio.txt', 'bio', 'about'], () => ({
  lines: [profile.headline, '', profile.bio],
  scrollTo: 'about',
}))
reg(['cat skills.json', 'skills', 'cat skills'], () => ({
  lines: skillsLines(),
  scrollTo: 'about',
}))
reg(['ls links/', 'ls links', 'links'], () => ({
  lines: ['./works   github   linkedin   resume.pdf'],
}))
reg(['ls -la ~/projects', 'ls ~/projects', 'ls projects', 'projects', 'works'], () => ({
  lines: projectsLines(),
  scrollTo: 'projects',
}))
reg(['git log --oneline --all', 'git log', 'experience', 'exp'], () => ({
  lines: experienceLines(),
  scrollTo: 'experience',
}))
reg(['cat certs.txt', 'certs', 'certifications'], () => ({
  lines: certifications.map((c) => `${bullet} ${c}`),
}))
reg(['./gym.sh --status', 'gym.sh', 'gym', './gym.sh'], () => ({
  lines: gymLines(),
  scrollTo: 'gym',
}))
reg(['./connect.sh', 'connect', 'contact', './connect.sh'], () => ({
  lines: contactLines(),
  scrollTo: 'contact',
}))
reg(['clear', 'cls'], () => ({ lines: [], action: 'clear' }))
reg(['resume.pdf', 'resume', 'open resume', 'cat resume.pdf'], () => ({
  lines: ['opening resume.pdf …'],
  action: 'resume',
}))
reg(['play_soundtrack.sh', 'play', 'music', './play_soundtrack.sh'], () => ({
  lines: ['toggling soundtrack …'],
  action: 'music',
}))
reg(['email', 'mail'], () => ({
  lines: [`opening mail to ${socials.email} …`],
  action: 'email',
}))
// fun extras
reg(['date'], () => ({ lines: [new Date().toString()] }))
reg(['ls', 'ls -la', 'dir'], () => ({
  lines: [
    'role.txt  bio.txt  skills.json  certs.txt  links/  projects/',
    'gym.sh*  connect.sh*  play_soundtrack.sh*  resume.pdf',
  ],
}))
reg(['pwd'], () => ({ lines: ['/home/sam/portfolio'] }))
reg(['echo'], () => ({ lines: [''] }))

export function runCommand(raw: string): CmdResult {
  const n = norm(raw)
  if (!n) return { lines: [] }
  if (n.startsWith('echo ')) return { lines: [raw.trim().slice(5)] }
  if (n.startsWith('cd ') || n.startsWith('goto ')) {
    const target = n.split(' ')[1]?.replace(/[/~.]/g, '')
    const known = ['about', 'projects', 'experience', 'gym', 'contact']
    if (target && known.includes(target))
      return { lines: [`→ ${target}`], scrollTo: target }
  }
  const hit = TABLE[n]
  if (hit) return hit()
  return {
    lines: [
      `command not found: ${raw.trim()}`,
      'type `help` to see what I can run.',
    ],
    error: true,
  }
}

// For autocomplete suggestions.
export function suggest(raw: string): string[] {
  const n = norm(raw)
  if (!n) return []
  return COMMANDS.map((c) => c.cmd)
    .concat(['skills', 'projects', 'experience', 'gym', 'contact', 'email'])
    .filter((c) => c.toLowerCase().startsWith(n) && c.toLowerCase() !== n)
    .slice(0, 5)
}
