import Image from 'next/image'
import { profile, socials } from '../lib/data'
import { Typewriter } from './typewriter'

function Cmd({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm">
      <span className="text-primary">sam@portfolio</span>
      <span className="text-muted">:</span>
      <span className="text-foreground/60">~</span>
      <span className="text-muted">$ </span>
      <span className="text-foreground">{children}</span>
    </div>
  )
}

export function Hero() {
  return (
    <section className="px-4 pt-28 pb-16">
      <div className="mx-auto max-w-4xl">
        <div className="term">
          <div className="term-bar">
            <span className="term-dot" />
            <span className="term-dot" />
            <span className="term-dot" />
            <span className="ml-2 text-xs text-muted">sam@portfolio: ~ — zsh</span>
          </div>

          <div className="term-body space-y-5 text-sm leading-relaxed">
            <div className="flex flex-col-reverse gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-5">
                <div>
                  <Cmd>whoami</Cmd>
                  <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
                    <Typewriter text={profile.name} />
                  </p>
                </div>

                <div>
                  <Cmd>cat role.txt</Cmd>
                  <p className="mt-1 text-foreground/80">
                    {profile.role} · {profile.location}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <div className="rounded-md border border-white/15 p-1">
                  <Image
                    src={profile.avatar}
                    alt={profile.name}
                    width={120}
                    height={120}
                    className="h-24 w-24 rounded object-cover grayscale sm:h-28 sm:w-28"
                    priority
                    unoptimized
                  />
                </div>
                <p className="mt-1 text-center text-[10px] text-muted">
                  ./avatar.png
                </p>
              </div>
            </div>

            <div>
              <Cmd>cat bio.txt</Cmd>
              <p className="mt-1 max-w-2xl text-foreground/80">{profile.headline}</p>
              <p className="mt-2 max-w-2xl text-muted">{profile.bio}</p>
            </div>

            <div>
              <Cmd>ls links/</Cmd>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
                <a
                  href="#projects"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  ./works
                </a>
                <a
                  href={socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  github
                </a>
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  linkedin
                </a>
                <a
                  href={socials.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  resume.pdf
                </a>
              </div>
            </div>

            {profile.available && (
              <p className="text-xs text-muted">
                <span className="text-muted/60"># </span>
                status: open to ML / AI roles &amp; collaborations
              </p>
            )}

            <div className="text-sm">
              <span className="text-primary">sam@portfolio</span>
              <span className="text-muted">:</span>
              <span className="text-foreground/60">~</span>
              <span className="text-muted">$ </span>
              <span className="cursor" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
