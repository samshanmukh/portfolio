// ---------------------------------------------------------------------------
// Everything the site knows about Sam, as plain text for the Mistral chat.
// Server-only (reads the blog from disk). Mistral's context window is big, so
// nothing is trimmed: profile, skills, every project, jobs, education,
// recommendations, the gym, and the full blog posts.
// ---------------------------------------------------------------------------
import {
  profile,
  testimonials,
  siteUrl,
  socials,
  skills,
  projects,
  experience,
  education,
  certifications,
  languages,
  gym,
} from './data'
import { getPost, getPosts } from './posts'

// the phone number stays out: the site only hands it out through the badge on phones
const { sms: _sms, ...publicSocials } = socials

export function fullContext(): string {
  const posts = getPosts()
    .map((p) => getPost(p.slug))
    .filter((p) => p !== null)
    .map((p) => `### ${p.title} (${p.date}, ${siteUrl}/blog/${p.slug})\n${p.content.trim()}`)

  const json = (v: unknown) => JSON.stringify(v, null, 2)
  return [
    `SITE: ${siteUrl}`,
    `PROFILE:\n${json(profile)}`,
    `LINKS (resume is ${siteUrl}${socials.resume}):\n${json(publicSocials)}`,
    `SKILLS:\n${json(skills)}`,
    `PROJECTS:\n${json(projects)}`,
    `EXPERIENCE:\n${json(experience)}`,
    `EDUCATION:\n${json(education)}`,
    `CERTIFICATIONS:\n${json(certifications)}`,
    `LANGUAGES: ${languages.join(', ')}`,
    `GYM:\n${json(gym)}`,
    `RECOMMENDATIONS FROM PEOPLE I'VE WORKED WITH:\n${json(testimonials)}`,
    `MY BLOG POSTS:\n${posts.join('\n\n')}`,
  ].join('\n\n')
}
