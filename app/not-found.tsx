import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-sm text-primary">error 404</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
        This route isn&apos;t in the <span className="text-gradient">graph</span>.
      </h1>
      <p className="mt-4 max-w-md text-muted">
        The page you’re after doesn’t exist — but my portfolio agent is happy to
        point you somewhere useful.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-gradient-to-r from-primary to-[#dcbb8e] px-5 py-2.5 text-sm font-semibold text-[#1c130a] transition-opacity hover:opacity-90"
      >
        ← Back home
      </Link>
    </main>
  )
}
