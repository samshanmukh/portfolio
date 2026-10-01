import { socials } from './data'

// On a phone, open the Messages app to Sam's number with "Hey!" ready to send.
// Returns false on desktop so the caller can fall back to the in-site contact answer.
export function openSmsOnPhone(): boolean {
  if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return false
  window.location.href = socials.sms
  return true
}
