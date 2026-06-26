import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'
import { profile } from './lib/data'

export const alt = `${profile.name} — ${profile.role}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  const photo =
    'data:image/jpeg;base64,' +
    readFileSync(join(process.cwd(), 'public', 'avatar.jpg')).toString('base64')

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#15100b',
          color: '#f4efe6',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -180,
            right: -120,
            width: 560,
            height: 560,
            borderRadius: 9999,
            background: 'radial-gradient(closest-side, rgba(185,137,90,0.35), transparent)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#b9895a', fontSize: 26, fontWeight: 600 }}>
            <div style={{ width: 28, height: 2, background: '#b9895a' }} />
            EMBED · SHIP · ITERATE
          </div>
          <div style={{ marginTop: 18, fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>
            {profile.name}
          </div>
          <div style={{ marginTop: 14, fontSize: 34, color: '#dcbb8e' }}>{profile.role}</div>
          <div style={{ marginTop: 22, fontSize: 26, color: '#ab9d88', maxWidth: 560, lineHeight: 1.35 }}>
            {profile.headline}
          </div>
          <div style={{ marginTop: 30, display: 'flex', gap: 10, fontSize: 22, color: '#ab9d88' }}>
            <span style={{ border: '1px solid rgba(200,180,150,0.3)', borderRadius: 8, padding: '6px 14px' }}>
              chat with my portfolio agent
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            width={300}
            height={400}
            style={{ borderRadius: 24, objectFit: 'cover', border: '2px solid rgba(200,180,150,0.25)' }}
            alt=""
          />
        </div>
      </div>
    ),
    size
  )
}
