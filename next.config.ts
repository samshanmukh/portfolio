import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Pin the workspace root so Next.js doesn't pick up unrelated lockfiles elsewhere on disk.
  outputFileTracingRoot: __dirname,
}

export default nextConfig
