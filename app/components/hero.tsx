import Image from 'next/image'
import { profile, socials } from '../lib/data'

export function Hero() {
  return (
    <section className="bg-dots relative overflow-hidden pt-36 pb-24">
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -top-20 -left-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute top-10 right-0 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl [animation-delay:-7s]"
      />

      <div className="relative mx-auto flex max-w-4xl flex-col items-start gap-10 px-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          {profile.available && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-muted">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Open to ML / AI roles & collaborations
            </div>
          )}

          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            {profile.name.split(' ')[0]}{' '}
            <span className="text-gradient">{profile.name.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="mt-3 font-mono text-sm text-primary">
            {profile.role} · {profile.location}
          </p>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/90">
            {profile.headline}
          </p>
          <p className="mt-4 max-w-xl leading-relaxed text-muted">
            {profile.bio}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#projects"
              className="rounded-lg bg-gradient-to-r from-primary to-cyan-400 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              See my work
            </a>
            <a
              href={socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
            >
              GitHub
            </a>
            <a
              href={socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
            >
              LinkedIn
            </a>
          </div>
        </div>

        <div className="relative shrink-0">
          <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-primary to-cyan-400 opacity-30 blur-xl" />
          <Image
            src={profile.avatar}
            alt={profile.name}
            width={160}
            height={160}
            className="relative h-36 w-36 rounded-full border border-white/10 object-cover sm:h-40 sm:w-40"
            priority
            unoptimized
          />
        </div>
      </div>
    </section>
  )
}
