// One-time helper to get SPOTIFY_REFRESH_TOKEN for the "now playing" widget.
//
// 1. Create an app at https://developer.spotify.com/dashboard and add the redirect URI
//    below (Settings → Redirect URIs). It doesn't need to resolve to a real page.
// 2. Run: node scripts/get-spotify-token.mjs
// 3. Paste the client ID + secret, open the printed link, approve, then paste the `code`
//    from the URL you land on. Put the three values in Vercel env vars (and .env.local).
import { createInterface } from 'node:readline/promises'

const redirectUri = process.env.SPOTIFY_REDIRECT_URI ?? 'http://127.0.0.1:3000/callback'
const rl = createInterface({ input: process.stdin, output: process.stdout })

const clientId = (await rl.question('SPOTIFY_CLIENT_ID: ')).trim()
const clientSecret = (await rl.question('SPOTIFY_CLIENT_SECRET: ')).trim()
const scope = 'user-read-currently-playing user-read-recently-played'
const params = new URLSearchParams({ client_id: clientId, response_type: 'code', redirect_uri: redirectUri, scope })
console.log(`\nOpen this link and approve:\nhttps://accounts.spotify.com/authorize?${params}\n`)
console.log(`You'll land on ${redirectUri}?code=... (a "can't connect" page is fine).`)

const code = (await rl.question('\nPaste the code from that URL: ')).trim()
rl.close()

const res = await fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
  },
  body: new URLSearchParams({ code, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
})
const data = await res.json()
if (data.refresh_token) console.log(`\nSPOTIFY_REFRESH_TOKEN=${data.refresh_token}`)
else console.error('\nSpotify returned an error:', data)
