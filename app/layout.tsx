import type { Metadata } from 'next'
import './globals.css'
import { profile, socials } from './lib/data'
import { InteractiveBackground } from './components/interactive-background'

export const metadata: Metadata = {
  // TODO: set this to your real deployed URL so link previews resolve correctly.
  metadataBase: new URL('https://samshanmukh.github.io'),
  title: `${profile.name} — ${profile.role}`,
  description: profile.headline,
  keywords: [
    'Machine Learning Engineer',
    'AI Engineer',
    'Data Scientist',
    'LLM agents',
    'RAG',
    'Computer Vision',
    profile.name,
  ],
  authors: [{ name: profile.name }],
  openGraph: {
    title: `${profile.name} — ${profile.role}`,
    description: profile.headline,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${profile.name} — ${profile.role}`,
    description: profile.headline,
  },
}

// JSON-LD structured data so search engines / recruiter tools understand the page.
const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  jobTitle: profile.role,
  url: 'https://samshanmukh.github.io',
  image: '/avatar.jpg',
  email: `mailto:${socials.email}`,
  address: { '@type': 'PostalAddress', addressLocality: 'San Francisco', addressRegion: 'CA' },
  sameAs: [socials.github, socials.linkedin, socials.twitter],
  knowsAbout: [
    'Machine Learning',
    'Deep Learning',
    'LLM Agents',
    'Generative AI',
    'Computer Vision',
    'Data Science',
  ],
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
      <body className="min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <InteractiveBackground />
        {children}
      </body>
    </html>
  )
}
