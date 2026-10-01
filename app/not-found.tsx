import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-muted">error 404</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
        This route isn&apos;t in the <span className="text-primary">graph</span>.
      </h1>
      <p className="mt-4 max-w-md text-muted">
        The page you’re after doesn’t exist, but my portfolio agent is happy to
        point you somewhere useful.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-[#0171E3] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
      >
        ← Back home
      </Link>
    </main>
  )
}
