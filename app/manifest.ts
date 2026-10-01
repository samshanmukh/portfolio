import type { MetadataRoute } from 'next'
import { profile } from './lib/data'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${profile.name} · ${profile.role}`,
    short_name: profile.shortName,
    description: profile.headline,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [{ src: '/icon.jpg', sizes: '256x256', type: 'image/jpeg' }],
  }
}
