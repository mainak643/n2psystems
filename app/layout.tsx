import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Toaster } from '@/components/ui/toaster'
import Script from 'next/script'
import { SITE_URL } from '@/lib/site'
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildFaqSchema,
} from '@/lib/seo-schema'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  // Resolves the relative `alternates.canonical` values set on each page.
  metadataBase: new URL(SITE_URL),
  title: 'N2P Systems | Global Technology Recruitment',
  description:
    'Connecting elite technology professionals with leading companies across Canada, USA, and India. Precision-driven hiring for Software Engineering, Data Science, DevOps, AI/ML, Cybersecurity, and Product Leadership.',
  keywords: [
    'technology recruitment',
    'tech hiring',
    'global recruitment',
    'software engineering jobs',
    'data science recruitment',
    'DevOps hiring',
    'AI ML recruitment',
    'Canada tech jobs',
    'USA tech recruitment',
    'India technology talent',
  ],
  alternates: {
    canonical: '/',
    types: {
      'text/markdown': `${SITE_URL}/llms.txt`,
      'application/rss+xml': `${SITE_URL}/jobs/rss`,
      'application/xml': `${SITE_URL}/jobs/feed.xml`,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  other: {
    'geo.region': 'CA-ON;US-TX;IN-MH',
    'geo.placename': 'Toronto;Austin;Airoli Navi Mumbai',
    'llms-txt': `${SITE_URL}/llms.txt`,
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : {}),
  },
  openGraph: {
    title: 'N2P Systems | Global Technology Recruitment',
    description:
      'Connecting elite technology professionals with leading companies across Canada, USA, and India.',
    type: 'website',
    siteName: 'N2P Systems',
    locale: 'en_US',
    // images: auto-populated from app/opengraph-image.tsx for every route
    // that doesn't declare its own.
  },
  icons: {
    icon: [
      { url: '/images/n2p-logo-light.png', type: 'image/png' },
    ],
    apple: [
      { url: '/images/n2p-logo-light.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'N2P Systems | Global Technology Recruitment',
    description:
      'Connecting elite technology professionals with leading companies across Canada, USA, and India.',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover' as const,
}

const fullSchemaGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    buildOrganizationSchema(),
    buildWebSiteSchema(),
    buildFaqSchema(),
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="alternate" type="text/markdown" href="/llms.txt" title="LLM Context Documentation" />
        <link rel="alternate" type="application/rss+xml" href="/jobs/rss" title="N2P Systems Jobs RSS Feed" />
        <link rel="alternate" type="application/xml" href="/jobs/feed.xml" title="N2P Systems Jobs XML Feed" />
      </head>
      <body className="font-sans antialiased overflow-x-hidden min-h-screen bg-background">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(fullSchemaGraph) }}
        />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Navbar />
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <Footer />
        {/*
          The toast system existed but was never mounted, so `toast()` rendered
          nothing and reported no error — a trap for the next person to reach
          for it. `components/ui/use-toast.ts` was also a byte-identical copy of
          `hooks/use-toast.ts` with no importers; it has been deleted, and this
          is the single Toaster that makes the remaining path work.
        */}
        <Toaster />
        <script
          id="reapdat-mobile-viewport-enhancer"
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  if (typeof window === 'undefined') return;
  var origAttach = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function(init) {
    var isReapdat = this.id === 'ai-agent-widget' || (this.classList && this.classList.contains('ai-agent-widget'));
    var shadow = origAttach.call(this, isReapdat ? Object.assign({}, init, { mode: 'open' }) : init);
    if (isReapdat) {
      var host = this;
      var injectStyles = function() {
        if (shadow.getElementById('n2p-reapdat-mobile-overrides')) return;
        var style = document.createElement('style');
        style.id = 'n2p-reapdat-mobile-overrides';
        style.textContent = [
          '@media (max-width: 640px) {',
          '  .widget-container:has(.chat-window.open),',
          '  .widget-container.chat-is-open {',
          '    position: fixed !important;',
          '    inset: 0 !important;',
          '    top: 0 !important;',
          '    bottom: 0 !important;',
          '    left: 0 !important;',
          '    right: 0 !important;',
          '    width: 100vw !important;',
          '    height: 100dvh !important;',
          '    max-width: 100vw !important;',
          '    max-height: 100dvh !important;',
          '    margin: 0 !important;',
          '    padding: 0 !important;',
          '    border: none !important;',
          '    border-radius: 0 !important;',
          '    pointer-events: auto !important;',
          '    z-index: 2147483647 !important;',
          '  }',
          '  .chat-window.open {',
          '    position: fixed !important;',
          '    inset: 0 !important;',
          '    top: 0 !important;',
          '    bottom: 0 !important;',
          '    left: 0 !important;',
          '    right: 0 !important;',
          '    width: 100vw !important;',
          '    height: 100dvh !important;',
          '    max-width: 100vw !important;',
          '    max-height: 100dvh !important;',
          '    margin: 0 !important;',
          '    border-radius: 0 !important;',
          '    border: none !important;',
          '    box-shadow: none !important;',
          '    z-index: 2147483647 !important;',
          '  }',
          '  .chat-window.open ~ .launcher-circle,',
          '  .chat-window.open ~ #launcher-circle,',
          '  .widget-container.chat-is-open .launcher-circle,',
          '  .widget-container:has(.chat-window.open) .launcher-circle {',
          '    display: none !important;',
          '  }',
          '  #maximize-btn { display: none !important; }',
          '  .header { padding-top: max(16px, env(safe-area-inset-top, 0px)) !important; }',
          '  .input-area { padding-bottom: max(16px, env(safe-area-inset-bottom, 0px)) !important; }',
          '}',
          '@media (min-width: 641px) {',
          '  .chat-window {',
          '    width: min(var(--rdw-width, 410px), calc(100vw - 32px)) !important;',
          '    height: min(var(--rdw-height, 650px), calc(100vh - 90px - env(safe-area-inset-bottom, 0px))) !important;',
          '  }',
          '}'
        ].join('\\n');
        shadow.appendChild(style);
      };

      injectStyles();
      setTimeout(injectStyles, 0);
      setTimeout(injectStyles, 500);

      try {
        var obs = new MutationObserver(function() {
          var win = shadow.querySelector('.chat-window');
          var isOpen = win && win.classList.contains('open');
          var container = shadow.querySelector('.widget-container');
          if (isOpen) {
            host.setAttribute('data-open', 'true');
            if (container) container.classList.add('chat-is-open');
            if (window.innerWidth <= 640) {
              document.documentElement.classList.add('reapdat-modal-open');
            }
          } else {
            host.removeAttribute('data-open');
            if (container) container.classList.remove('chat-is-open');
            document.documentElement.classList.remove('reapdat-modal-open');
          }
        });
        obs.observe(shadow, { subtree: true, attributes: true, attributeFilter: ['class'] });
      } catch(e) {}
    }
    return shadow;
  };
})();
            `
          }}
        />
        <Script
          src="https://api.reapdat.com/static/widget.js"
          data-tenant-id="01d65500-be64-4909-b7d5-598d460c97e4"
          data-key="pk_live_97kJ26nJjkBq3kj1zlKb1TiLDtKNnY8I"
          data-avatar-url={`${SITE_URL}/images/n2p-logo-light.png`}
          data-company-name="N2P Systems"
          strategy="afterInteractive"
        />
        <Analytics />
      </body>
    </html>
  )
}
