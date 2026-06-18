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

// neofetch-style system info shown beside the avatar
const sysInfo: [string, string][] = [
  ['host', 'sam@portfolio'],
  ['os', 'ml-engineer 8.x'],
  ['shell', 'zsh'],
  ['editor', 'vim'],
  ['location', profile.location],
  ['focus', 'LLM agents · CV · RAG'],
  ['langs', 'python · ts · dart'],
  ['status', 'open to work'],
]

export function Hero() {
  return (
    <section className="pt-28 pb-16">
      <div className="wrap">
        <div className="term">
          <div className="term-bar">
            <span className="term-dot" />
            <span className="term-dot" />
            <span className="term-dot" />
            <span className="ml-2 text-xs text-muted">sam@portfolio: ~ — zsh</span>
          </div>

          <div className="term-body text-sm leading-relaxed">
            <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
              {/* left: the shell session */}
              <div className="min-w-0 flex-1 space-y-5 lg:max-w-2xl">
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

                <div>
                  <Cmd>cat bio.txt</Cmd>
                  <p className="mt-1 text-foreground/80">{profile.headline}</p>
                  <p className="mt-2 text-muted">{profile.bio}</p>
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

                <p className="text-xs text-muted">
                  <span className="text-muted/60"># </span>
                  tip: use the command bar at the bottom — try{' '}
                  <span className="text-foreground/70">help</span>
                </p>
              </div>

              {/* right: avatar + neofetch-style system info */}
              <aside className="shrink-0 lg:w-72">
                <div className="flex items-start gap-4 lg:flex-col lg:items-stretch">
                  <div className="shrink-0">
                    <div className="overflow-hidden rounded-md border border-white/15 p-1">
                      <Image
                        src={profile.avatar}
                        alt={profile.name}
                        width={372}
                        height={496}
                        className="aspect-[3/4] w-32 rounded object-cover object-top sm:w-40 lg:w-full"
                        priority
                        unoptimized
                      />
                    </div>
                    <p className="mt-1 text-center text-[10px] text-muted">
                      ./sam.jpg
                    </p>
                  </div>

                  <dl className="space-y-1 text-xs lg:mt-4">
                    {sysInfo.map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="w-16 shrink-0 text-primary">{k}</dt>
                        <dd className="text-muted">
                          <span className="text-muted/50">: </span>
                          {v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
