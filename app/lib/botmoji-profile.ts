function decode(text: string) {
  return text.replace(/&#(x[\da-f]+|\d+);/gi, (_, n: string) => {
    const code = n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n)
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ''
  }).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim()
}

export function publicProfileMetadata(html: string) {
  const meta: Record<string, string> = {}
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs: Record<string, string> = {}
    for (const attr of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)) attrs[attr[1].toLowerCase()] = decode(attr[3])
    if (attrs.property || attrs.name) meta[attrs.property || attrs.name] = attrs.content || ''
  }
  const title = meta['og:title'] || decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '')
  const description = meta['og:description'] || meta.description || ''
  // LinkedIn login walls sometimes return 200 with generic site metadata.
  if (!title || /sign[ -]?in|log[ -]?in|sign[ -]?up|security verification|join linkedin/i.test(title)) return null
  const name = title.replace(/\s*\|\s*LinkedIn.*$/i, '').split(/\s+[–—-]\s+/)[0].slice(0, 70)
  const headlineParts = [title.replace(name, '').replace(/^[\s–—-]+|\s*\|\s*LinkedIn.*$/gi, ''), description]
  // Public profiles sometimes expose richer job / skills information in JSON-LD.
  // Read only the matching Person; scripts and their contents are never executed.
  const visit = (value: unknown, depth = 0): void => {
    if (!value || typeof value !== 'object' || depth > 5) return
    if (Array.isArray(value)) { value.slice(0, 25).forEach((entry) => visit(entry, depth + 1)); return }
    const person = value as Record<string, unknown>
    const types = Array.isArray(person['@type']) ? person['@type'] : [person['@type']]
    if (types.includes('Person') && typeof person.name === 'string' && person.name.toLowerCase().trim() === name.toLowerCase().trim()) {
      for (const key of ['jobTitle', 'description', 'knowsAbout']) {
        const field = person[key]
        if (typeof field === 'string') headlineParts.push(field.slice(0, 2000))
        if (Array.isArray(field)) headlineParts.push(...field.filter((item): item is string => typeof item === 'string').slice(0, 20))
      }
    }
    for (const key of ['@graph', 'mainEntity', 'mainEntityOfPage']) visit(person[key], depth + 1)
  }
  for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/type\s*=\s*["']application\/ld\+json["']/i.test(script[1])) continue
    try { visit(JSON.parse(script[2])) } catch { /* Ignore malformed structured data. */ }
  }
  const headline = [...new Set(headlineParts.map(decode).filter(Boolean))].join('. ').slice(0, 4000)
  return name && !/^linkedin$/i.test(name) && headline.length > 10 ? { name, headline } : null
}
