import { Nav } from './components/nav'
import { Hero } from './components/hero'
import { About } from './components/about'
import { Projects } from './components/projects'
import { Experience } from './components/experience'
import { Gym } from './components/gym'
import { Contact } from './components/contact'
import { profile, socials } from './lib/data'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <About />
        <Projects />
        <Experience />
        <Gym />
        <Contact />
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
