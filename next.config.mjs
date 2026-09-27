/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '10.227.206.42',
    '10.227.206.42:3000',
    'localhost:3000',
  ],
  poweredByHeader: false,
  /*
    The board lives at /jobs, but "careers" is the word people type and share
    (n2psystems.com/careers/REQ-123/apply). Permanent redirects so every such
    link lands on the real page and search engines consolidate on one URL.
  */
  async redirects() {
    return [
      { source: '/careers', destination: '/jobs', permanent: true },
      { source: '/career', destination: '/jobs', permanent: true },
      { source: '/careers/:path*', destination: '/jobs/:path*', permanent: true },
      { source: '/career/:path*', destination: '/jobs/:path*', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=*, geolocation=(), browsing-topics=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.reapdat.com https://*.reapdat.in https://esm.sh https://cdn.jsdelivr.net https://unpkg.com https://snap.licdn.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https: wss: data: blob:",
              "media-src 'self' blob: data: https:",
              "worker-src 'self' blob:",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
