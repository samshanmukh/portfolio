const stack = ['TypeScript', 'React', 'Next.js', 'Node', 'Tailwind']

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-40 pb-24">
      {/* gradient blobs */}
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -top-10 right-0 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-3xl [animation-delay:-6s]"
      />

      <div className="relative mx-auto max-w-3xl px-6">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Available for new projects
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Hi, I&apos;m{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Sam Shanmukh
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-400">
          A software engineer who builds clean, fast, and thoughtful products. I
          care about the small details that make software feel effortless — and
          I&apos;m always shipping something new.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {stack.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="#projects"
            className="rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            View my work
          </a>
          <a
            href="#contact"
            className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/5"
          >
            Get in touch
          </a>
        </div>
      </div>
    </section>
  )
}
