import type { Metadata } from 'next'
import { Studio } from './studio'

export const metadata: Metadata = {
  title: 'Avatar Studio',
  description: 'Build your own live 3D avatar and download it as a single HTML file that runs in any browser.',
}

export default function StudioPage() {
  return <Studio />
}
