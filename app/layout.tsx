import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import Script from 'next/script'
import { SITE_URL } from '@/lib/site'
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

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'EmploymentAgency'],
  '@id': `${SITE_URL}/#organization`,
  name: 'N2P Systems',
  legalName: 'N2P Systems Inc.',
  url: SITE_URL,
  logo: `${SITE_URL}/images/n2p-logo-light.png`,
  description:
    'Connecting elite technology professionals with leading companies across Canada, USA, and India. Precision-driven hiring for Software Engineering, Data Science, DevOps, AI/ML, Cybersecurity, and Product Leadership.',
  sameAs: [
    'https://www.linkedin.com/company/n2p-systems/',
    'https://ops.n2psystems.com',
  ],
  knowsAbout: [
    'Software Engineering Recruitment',
    'Data Science & AI/ML Talent',
    'DevOps & Cloud Engineering',
    'Cybersecurity Staffing',
    'Executive & Technical Leadership Hiring',
  ],
  areaServed: [
    { '@type': 'Country', name: 'Canada' },
    { '@type': 'Country', name: 'United States' },
    { '@type': 'Country', name: 'India' },
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'recruitment',
      email: 'info@n2psystems.ca',
      telephone: '+91 97760 47567',
      availableLanguage: ['English'],
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased overflow-x-hidden min-h-screen bg-background">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Navbar />
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <Footer />
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
