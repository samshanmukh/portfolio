import { SectionHeading } from './section-heading'

const posts = [
  {
    title: 'Why I always reach for static typing',
    date: 'Jun 2026',
    summary: 'Catching bugs at compile time pays for itself in fewer 2am pages.',
    href: '#',
  },
  {
    title: 'Small details that make software feel fast',
    date: 'May 2026',
    summary: 'Perceived performance is mostly about loading states and motion.',
    href: '#',
  },
  {
    title: 'My terminal setup in 2026',
    date: 'Apr 2026',
    summary: 'Vim, tmux, and the keybindings I would not give up.',
    href: '#',
  },
]

export function Blog() {
  return (
    <section id="blog" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading eyebrow="Writing" title="From the blog" />
        <ul className="divide-y divide-white/5">
          {posts.map((post) => (
            <li key={post.title}>
              <a
                href={post.href}
                className="group flex flex-col gap-1 py-5 transition-colors sm:flex-row sm:items-baseline sm:justify-between"
              >
                <div className="max-w-lg">
                  <h3 className="font-medium text-neutral-100 group-hover:text-white">
                    {post.title}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    {post.summary}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-neutral-500">
                  {post.date}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
