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
        <div className="mx-auto max-w-4xl px-6 font-mono text-sm text-muted">
          © {new Date().getFullYear()} {profile.name}. Built from scratch with
          Next.js & Tailwind.
        </div>
      </footer>
    </>
  )
}
