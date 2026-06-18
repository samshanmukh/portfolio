import Image from 'next/image'
import { profile, socials } from '../lib/data'
import { PortfolioAgent } from './portfolio-agent'

export function Hero() {
  const [first, ...rest] = profile.name.split(' ')
  return (
    <section className="pt-28 pb-16">
      <div className="wrap grid items-stretch gap-10 lg:grid-cols-2">
        {/* intro */}
        <div className="flex flex-col justify-center">
          {profile.available && (
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#dcbb8e]" />
              Open to ML / AI roles &amp; collaborations
            </div>
          )}

          <div className="flex items-start gap-5">
            <div className="shrink-0 overflow-hidden rounded-xl border border-white/10 p-1">
              <Image
                src={profile.avatar}
                alt={profile.name}
                width={300}
                height={400}
                className="aspect-[3/4] w-28 rounded-lg object-cover object-top sm:w-36 lg:w-40"
                priority
                unoptimized
              />
            </div>
            <div className="pt-1">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {first} <span className="text-gradient">{rest.join(' ')}</span>
              </h1>
              <p className="mt-1 font-mono text-sm text-primary">
                {profile.role} · {profile.location}
              </p>
              <p className="mt-4 max-w-md text-base leading-relaxed text-foreground/90">
                {profile.headline}
              </p>
            </div>
          </div>

          <p className="mt-6 max-w-xl leading-relaxed text-muted">{profile.bio}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#projects"
              className="rounded-lg bg-gradient-to-r from-primary to-[#dcbb8e] px-5 py-2.5 text-sm font-semibold text-[#1c130a] transition-opacity hover:opacity-90"
            >
              View my work
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
            <a
              href={socials.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
            >
              Résumé
            </a>
          </div>
        </div>

        {/* agent */}
        <div className="h-[460px] lg:h-[520px]">
          <PortfolioAgent />
        </div>
      </div>
    </section>
  )
}
