import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'
import { profile } from './data'

// Link-preview card (1200x630) in the site's current look: soft liquid colour blobs on white,
// the Memoji, the name, and the glass ask box with its greeting and send arrow.
export const ogSize = { width: 1200, height: 630 }
export const ogAlt = `${profile.name} — ${profile.role}`

const file = (...p: string[]) => readFileSync(join(process.cwd(), ...p))
const dataUri = (mime: string, buf: Buffer) => `data:${mime};base64,${buf.toString('base64')}`

export function renderOgCard() {
  const memoji = dataUri('image/png', file('public', 'memoji.png'))
  // 👋 from Twemoji (CC-BY 4.0, https://github.com/jdecked/twemoji)
  const wave = dataUri('image/svg+xml', file('assets', 'og', 'wave.svg'))
  const blob = (color: string, x: number, y: number, r: number) => (
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: 9999,
        background: `radial-gradient(circle, rgba(${color},0.3) 0%, rgba(${color},0) 70%)`,
      }}
    />
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          alignItems: 'center',
          background: '#ffffff',
          fontFamily: 'Inter',
          color: '#18181b',
        }}
      >
        {blob('236,72,153', 90, 80, 300)}
        {blob('59,130,246', 1130, 110, 330)}
        {blob('34,211,238', 1060, 600, 300)}
        {blob('168,85,247', 180, 600, 320)}

        {/* "Open to chat & connect" badge, top-left like the site */}
        <div
          style={{
            position: 'absolute',
            top: 44,
            left: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 22px',
            borderRadius: 9999,
            background: 'rgba(255,255,255,0.75)',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 6px 20px -10px rgba(0,0,0,0.25)',
            fontSize: 22,
            fontWeight: 500,
            color: '#3f3f46',
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: 9999, background: '#22c55e' }} />
          Open to chat & connect
        </div>

        {/* the Memoji stands on the bottom edge, like a bust */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={memoji} width={460} height={460} alt="" style={{ position: 'absolute', left: 40, bottom: 0 }} />

        <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '40px 80px 0 530px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>Sam Karri</div>
            <div style={{ marginTop: 16, fontSize: 32, fontWeight: 500, color: '#71717a' }}>{profile.role}</div>

            {/* the glass ask box */}
            <div
              style={{
                marginTop: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 14px 14px 34px',
                borderRadius: 9999,
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(0,0,0,0.09)',
                boxShadow: '0 18px 40px -22px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.9)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 32, fontWeight: 500, color: '#52525b' }}>
                Hey, I&apos;m Sam
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={wave} width={36} height={36} alt="" />
              </div>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(244,244,245,0.8))',
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 6px 16px -8px rgba(0,0,0,0.3), inset 0 1px 1px #fff',
                }}
              >
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
            </div>
            <div style={{ marginTop: 22, fontSize: 24, color: '#a1a1aa' }}>samkarri.com · ask my portfolio anything</div>
          </div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: 'Inter', data: file('assets', 'og', 'inter-500.ttf'), weight: 500, style: 'normal' },
        { name: 'Inter', data: file('assets', 'og', 'inter-700.ttf'), weight: 700, style: 'normal' },
      ],
    }
  )
}
