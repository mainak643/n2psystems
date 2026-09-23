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
