import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Portfolio — Sam Shanmukh',
  description:
    'Software engineer building clean, fast, thoughtful software. Projects, writing, and ways to get in touch.',
  openGraph: {
    title: 'Portfolio — Sam Shanmukh',
    description: 'Software engineer building clean, fast, thoughtful software.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
