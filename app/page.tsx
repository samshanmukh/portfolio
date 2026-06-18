import { Nav } from './components/nav'
import { Hero } from './components/hero'
import { About } from './components/about'
import { Projects } from './components/projects'
import { Experience } from './components/experience'
import { Gym } from './components/gym'
import { Contact } from './components/contact'
import { profile } from './lib/data'

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
        <div className="wrap text-xs text-muted">
          <span className="text-muted/60"># </span>
          {new Date().getFullYear()} {profile.name} — built from scratch with
          low level coding. all rights reserved.
        </div>
      </footer>
    </>
  )
}
