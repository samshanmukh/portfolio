import type { Metadata, Viewport } from 'next'
import './globals.css'
import { profile, socials, siteUrl, skills, education, languages } from './lib/data'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const SEO_DESCRIPTION = `${profile.name}, ${profile.role} in San Francisco. 6+ years building LLM agents, RAG systems & computer-vision pipelines. ${profile.lookingFor}. Chat with my AI agent.`

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${profile.name} · ${profile.role}`,
    template: `%s · ${profile.name}`,
  },
  description: SEO_DESCRIPTION,
  applicationName: `${profile.name} · Portfolio`,
  category: 'technology',
  keywords: [
    profile.name,
    'Sam Karri',
    'Software Engineer',
    'Machine Learning Engineer',
    'AI Engineer',
    'Data Scientist',
    'LLM agents',
    'Agentic AI',
    'RAG',
    'Computer Vision',
    'Generative AI',
    'San Francisco',
    'hire ML engineer',
  ],
  authors: [{ name: profile.name, url: socials.linkedin }],
  creator: profile.name,
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    title: `${profile.name} · ${profile.role}`,
    description: SEO_DESCRIPTION,
    url: siteUrl,
    siteName: `${profile.name} · Portfolio`,
    type: 'profile',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${profile.name} · ${profile.role}`,
    description: SEO_DESCRIPTION,
    creator: '@samshanmukh',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // lets the chat input sit above the iPhone home indicator (safe-area padding)
  interactiveWidget: 'resizes-content', // Android: keyboard shrinks the page so the input stays visible
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

// Applies the saved theme before first paint (no light/dark flash). Light is the default.
// Theme follows the visitor's system setting, live; the toggle only overrides it for the current visit.
const themeScript = `try{localStorage.removeItem('theme')}catch(e){}try{var t=sessionStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(e){try{sessionStorage.removeItem('theme')}catch(_){}document.documentElement.classList.toggle('dark',e.matches)})}catch(e){}`

// Rich JSON-LD graph so search engines / recruiter tools fully understand the page.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': `${siteUrl}/#person`,
      name: profile.name,
      alternateName: 'Sam Karri',
      jobTitle: profile.role,
      description: profile.headline,
      url: siteUrl,
      image: `${siteUrl}/avatar.jpg`,
      email: `mailto:${socials.email}`,
      address: { '@type': 'PostalAddress', addressLocality: 'San Francisco', addressRegion: 'CA', addressCountry: 'US' },
      sameAs: [socials.github, socials.linkedin, socials.twitter, socials.instagram, socials.sourceRepo],
      knowsLanguage: languages,
      knowsAbout: skills.flatMap((s) => s.items),
      alumniOf: education.map((e) => ({ '@type': 'CollegeOrUniversity', name: e.school })),
      hasOccupation: {
        '@type': 'Occupation',
        name: profile.role,
        occupationLocation: { '@type': 'City', name: 'San Francisco' },
        skills: skills.flatMap((s) => s.items).join(', '),
      },
      seeks: { '@type': 'Demand', name: profile.lookingFor },
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: `${profile.name} · Portfolio`,
      inLanguage: 'en-US',
      about: { '@id': `${siteUrl}/#person` },
    },
    {
      '@type': 'ProfilePage',
      '@id': `${siteUrl}/#webpage`,
      url: siteUrl,
      name: `${profile.name} · ${profile.role}`,
      isPartOf: { '@id': `${siteUrl}/#website` },
      mainEntity: { '@id': `${siteUrl}/#person` },
      about: { '@id': `${siteUrl}/#person` },
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
      <body className="min-h-dvh bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
