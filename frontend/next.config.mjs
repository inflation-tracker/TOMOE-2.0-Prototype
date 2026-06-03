/** @type {import('next').NextConfig} */

// Security headers applied to every response. The CSP is intentionally
// permissive on img/connect (Leaflet tiles + the ML service live on other
// origins) but still shuts down framing, MIME sniffing, and referrer leakage.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js requires inline/eval for its runtime; tighten with nonces later.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https: http://localhost:8000",
      "font-src 'self' data:",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const nextConfig = {
  // Minimal self-contained server bundle for the production Docker image.
  output: 'standalone',
  webpack: (config) => {
    // Suppress "Critical dependency: the request of a dependency is an
    // expression" from Leaflet's dynamic require.
    config.module.unknownContextCritical = false
    return config
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
