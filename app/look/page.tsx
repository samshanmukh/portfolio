import { profile } from '../lib/data'

// Throwaway preview page: three distinct hero looks stacked so Sam can scroll
// /look and pick a direction. Each uses its own hard-coded styling (independent
// of the site theme) so the comparison is honest.

function Badge({ n, label }: { n: number; label: string }) {
  return (
    <div className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-black">
        {n}
      </span>
      {label}
    </div>
  )
}

export default function Look() {
  return (
    <main className="bg-black">
      {/* ── Option 1 — Dark minimal, big serif ───────────────────────── */}
      <section
        className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
        style={{ background: '#0a0a0a', color: '#f4f3f1' }}
      >
        <Badge n={1} label="Dark · minimal · big type" />
        <p
          className="mb-6 text-xs uppercase"
          style={{ letterSpacing: '0.4em', color: '#8a8a85', fontFamily: 'JetBrains Mono, monospace' }}
        >
          {profile.role}
        </p>
        <h1
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 'clamp(3rem, 11vw, 8.5rem)',
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            fontWeight: 500,
          }}
        >
          Sam <span style={{ color: '#7c7c78' }}>Karri</span>
        </h1>
        <p className="mt-7 max-w-md text-lg" style={{ color: '#9a9a96', lineHeight: 1.6 }}>
          I embed with teams and ship AI into production.
        </p>
        <div className="mt-10 flex gap-3">
          <span className="rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: '#f4f3f1', color: '#0a0a0a' }}>
            Talk to my AI
          </span>
          <span className="rounded-full border px-5 py-2.5 text-sm" style={{ borderColor: '#33332f', color: '#f4f3f1' }}>
            Get in touch
          </span>
        </div>
      </section>

      {/* ── Option 2 — Light friendly card ───────────────────────────── */}
      <section
        className="relative flex min-h-screen flex-col items-center justify-center px-6"
        style={{ background: '#f4f4f2', color: '#18181b' }}
      >
        <Badge n={2} label="Light · friendly · card" />
        <div
          className="w-full max-w-md rounded-[28px] bg-white p-8 text-center"
          style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.avatar}
            alt={profile.name}
            className="mx-auto h-24 w-24 rounded-full object-cover"
            style={{ boxShadow: '0 0 0 4px #fff, 0 8px 24px rgba(0,0,0,0.15)' }}
          />
          <h1 className="mt-5 text-3xl font-bold tracking-tight">Hey, I’m Sam 👋</h1>
          <p className="mt-2 text-[15px]" style={{ color: '#6b6b72' }}>
            {profile.role} who ships AI into production.
          </p>
          <div
            className="mt-6 flex items-center gap-2 rounded-full border px-2 py-2 pl-4"
            style={{ borderColor: 'rgba(0,0,0,0.12)' }}
          >
            <span className="flex-1 text-left text-sm" style={{ color: '#9a9aa2' }}>
              Ask me anything…
            </span>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-white"
              style={{ background: '#6d5efc' }}
            >
              ↑
            </span>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['👋 Me', '🛠️ Projects', '🧠 Skills', '✉️ Contact'].map((c) => (
              <span
                key={c}
                className="rounded-full border px-3 py-1.5 text-sm"
                style={{ borderColor: 'rgba(0,0,0,0.1)', color: '#3f3f46' }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Option 3 — Bold gradient ─────────────────────────────────── */}
      <section
        className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
        style={{
          background: 'linear-gradient(135deg, #4f2bd6 0%, #7b2ff7 40%, #d6249f 100%)',
          color: '#ffffff',
        }}
      >
        <Badge n={3} label="Bold · gradient · energetic" />
        <p className="mb-5 text-sm font-semibold uppercase" style={{ letterSpacing: '0.25em', color: 'rgba(255,255,255,0.8)' }}>
          {profile.role}
        </p>
        <h1
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 'clamp(2.75rem, 9vw, 6.5rem)',
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            fontWeight: 800,
            maxWidth: '14ch',
          }}
        >
          I ship AI that actually runs.
        </h1>
        <p className="mt-6 max-w-lg text-lg" style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
          Hey, I’m Sam — a Forward Deployed Engineer who embeds with teams and
          gets AI into production.
        </p>
        <div className="mt-9 flex gap-3">
          <span className="rounded-full px-6 py-3 text-sm font-bold" style={{ background: '#fff', color: '#7b2ff7' }}>
            Talk to my AI →
          </span>
          <span className="rounded-full px-6 py-3 text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            Résumé
          </span>
        </div>
      </section>
    </main>
  )
}
