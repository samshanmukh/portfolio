// House rules for smart mode replies, enforced in code because the prompt alone
// doesn't hold: no "**Sam:**" speaker label up front, and no em dashes or spaced en dashes
// (the site never shows them to visitors), swapped for a comma. Ranges like 2019–2021 stay.
const LABEL = /^\s*(?:\*\*)?\s*(?:Sam|Sanmukh)\b[^:\n*]{0,24}(?:\*\*)?\s*:\s*(?:\*\*)?\s*/i

export const cleanReply = (t: string) =>
  t
    .replace(LABEL, '')
    // "**Name** – what it is" reads as a label
    .replace(/(\*\*[^*\n]+\*\*) +[–—] +/g, '$1: ')
    .replace(/\s*—\s*/g, ', ')
    .replace(/ +– +/g, ', ')
    .replace(/ +,/g, ',')

// Smart mode ends a reply with [[book]] when the visitor wants to meet, or [[cancel]] when they
// want to cancel or move one, and the chat then takes over. The markers never show, not even
// half-streamed ("[[bo").
const MARKER = /\s*\[\[(?:book|cancel)\]\]\s*/gi
const MARKER_PARTIAL = /\s*\[(?:\[[a-z]*\]?)?$/i
export const splitBooking = (t: string) => ({
  book: /\[\[book\]\]/i.test(t),
  cancel: /\[\[cancel\]\]/i.test(t),
  text: t.replace(MARKER, ' ').replace(MARKER_PARTIAL, '').trim(),
})
