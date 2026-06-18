import { SectionHeading } from './section-heading'

const projects = [
  {
    title: 'Project One',
    description:
      'A short description of what this project does and the problem it solves. Replace with your real work.',
    tags: ['Next.js', 'TypeScript', 'Postgres'],
    href: '#',
  },
  {
    title: 'Project Two',
    description:
      'Another highlight from your portfolio. Mention impact, scale, or what made it interesting to build.',
    tags: ['React', 'Tailwind', 'API'],
    href: '#',
  },
  {
    title: 'Project Three',
    description:
      'A side project or open-source contribution. Link it out so people can explore the code or demo.',
    tags: ['Node', 'CLI'],
    href: '#',
  },
]

export function Projects() {
  return (
    <section id="projects" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading eyebrow="Work" title="Selected projects" />
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <a
              key={p.title}
              href={p.href}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">{p.title}</h3>
                <span className="text-neutral-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  ↗
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                {p.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-neutral-400"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
