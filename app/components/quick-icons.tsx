import { BriefcaseBusiness, CalendarDays, Laugh, Layers, PartyPopper, UserRoundSearch } from 'lucide-react'
import type { QuickKey } from '../lib/questions'

export const quickIcons: Record<QuickKey, typeof Laugh> = {
  Me: Laugh,
  Projects: BriefcaseBusiness,
  Skills: Layers,
  Fun: PartyPopper,
  Contact: UserRoundSearch,
  Events: CalendarDays,
}
