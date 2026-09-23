/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '10.227.206.42',
    '10.227.206.42:3000',
    'localhost:3000',
  ],
  poweredByHeader: false,
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
            value: 'camera=(), microphone=(self "https://api.reapdat.com" "https://api.reapdat.in"), geolocation=(), browsing-topics=()',
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://api.reapdat.com https://api.reapdat.in https://esm.sh https://cdn.jsdelivr.net https://unpkg.com https://snap.licdn.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.reapdat.com https://api.reapdat.in https://esm.sh https://cdn.jsdelivr.net https://unpkg.com https://*.ultravox.ai wss://*.ultravox.ai https://snap.licdn.com https://px.ads.linkedin.com https://va.vercel-scripts.com https://api.indexnow.org",
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
