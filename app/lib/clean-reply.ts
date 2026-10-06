// House rules for smart mode replies, enforced in code because the prompt alone
// doesn't hold: no "**Sam:**" speaker label up front, and no em dashes (the site
// never shows them to visitors), swapped for a comma.
const LABEL = /^\s*(?:\*\*)?\s*(?:Sam|Sanmukh)\b[^:\n*]{0,24}(?:\*\*)?\s*:\s*(?:\*\*)?\s*/i

export const cleanReply = (t: string) =>
  t
    .replace(LABEL, '')
    .replace(/\s*—\s*/g, ', ')
    .replace(/ +,/g, ',')
