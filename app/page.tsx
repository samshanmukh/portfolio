import { AiPortfolio } from './components/ai-portfolio'
import { profile } from './lib/data'

export default function Home() {
  return (
    <>
      {/* semantic h1 for SEO/screen-readers */}
      <h1 className="sr-only">
        {profile.name} — {profile.role}, {profile.location}. {profile.headline}
      </h1>
      <AiPortfolio />
    </>
  )
}
