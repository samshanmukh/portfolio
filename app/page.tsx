import { Nav } from './components/nav'
import { Hero } from './components/hero'
import { Projects } from './components/projects'
import { Blog } from './components/blog'
import { Contact } from './components/contact'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Projects />
        <Blog />
        <Contact />
      </main>
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-3xl px-6 text-sm text-neutral-500">
          © {new Date().getFullYear()} Sam Shanmukh. Built with Next.js &
          Tailwind.
        </div>
      </footer>
    </>
  )
}
