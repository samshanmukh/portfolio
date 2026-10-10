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

// Smart mode ends a reply with [[book]] when the visitor wants to meet, and the chat shows the
// booking card under it. The marker never shows, not even half-streamed ("[[bo").
const BOOK = /\s*\[\[book\]\]\s*/gi
const BOOK_PARTIAL = /\s*\[(?:\[(?:b(?:o(?:o(?:k\]?)?)?)?)?)?$/i
export const splitBooking = (t: string) => ({
  book: /\[\[book\]\]/i.test(t),
  text: t.replace(BOOK, ' ').replace(BOOK_PARTIAL, '').trim(),
})
