import { Nav } from './components/nav'
import { Hero } from './components/hero'
import { PortfolioAgent } from './components/portfolio-agent'
import { Approach } from './components/approach'
import { Projects } from './components/projects'
import { AiTrainer } from './components/ai-trainer'
import { GithubNow } from './components/github-now'
import { Experience } from './components/experience'
import { Testimonials } from './components/testimonials'
import { Gym } from './components/gym'
import { About } from './components/about'
import { Contact } from './components/contact'
import { Reveal } from './components/reveal'
import { profile, socials } from './lib/data'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />

        {/* the hook — talk to a deployed agent that knows the whole story */}
        <Reveal>
          <section id="ask" className="scroll-mt-24 py-24 sm:py-28">
            <div className="wrap mx-auto max-w-3xl">
              <div className="mb-7 text-center">
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-primary">
                  Don’t take my word for it
                </p>
                <h2 className="font-display text-3xl leading-[1.1] text-foreground sm:text-4xl">
                  Talk to the deployed version of me.
                </h2>
                <p className="mt-3 text-muted">
                  This agent runs entirely in your browser and knows my work,
                  projects, and story. Go ahead — interrogate it.
                </p>
              </div>
              <div className="h-[480px] lg:h-[540px]">
                <PortfolioAgent />
              </div>
            </div>
          </section>
        </Reveal>

        {/* the story, chapter by chapter */}
        <Reveal>
          <Approach />
        </Reveal>
        <Reveal>
          <Projects />
        </Reveal>
        <Reveal>
          <AiTrainer />
        </Reveal>
        <Reveal>
          <GithubNow />
        </Reveal>
        <Reveal>
          <Experience />
        </Reveal>
        <Reveal>
          <Testimonials />
        </Reveal>
        <Reveal>
          <Gym />
        </Reveal>
        <Reveal>
          <About />
        </Reveal>
        <Reveal>
          <Contact />
        </Reveal>
      </main>
      <footer className="border-t border-white/5 py-8">
        <div className="wrap flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span>
            <span className="text-muted/60"># </span>
            {new Date().getFullYear()} {profile.name} — hand-coded from scratch,
            no templates. all rights reserved.
          </span>
          <a
            href={socials.sourceRepo}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
          >
            [ view source ]
          </a>
        </div>
      </footer>
    </>
  )
}
