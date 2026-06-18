import type { Metadata } from 'next'
import './globals.css'
import { profile } from './lib/data'
import { InteractiveBackground } from './components/interactive-background'
import { MusicPlayer } from './components/music-player'
import { CommandConsole } from './components/command-console'

export const metadata: Metadata = {
  // TODO: set this to your real deployed URL so link previews resolve correctly.
  metadataBase: new URL('https://samshanmukh.github.io'),
  title: `${profile.name} — ${profile.role}`,
  description: profile.headline,
  openGraph: {
    title: `${profile.name} — ${profile.role}`,
    description: profile.headline,
    type: 'website',
    images: [{ url: profile.avatar, width: 1860, height: 2480, alt: profile.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${profile.name} — ${profile.role}`,
    description: profile.headline,
    images: [profile.avatar],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen pb-14">
        <InteractiveBackground />
        {children}
        <MusicPlayer />
        <CommandConsole />
      </body>
    </html>
  )
}
