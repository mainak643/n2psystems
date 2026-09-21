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
        <Script
          src="https://api.reapdat.com/static/widget.js"
          data-tenant-id="01d65500-be64-4909-b7d5-598d460c97e4"
          data-key="pk_live_97kJ26nJjkBq3kj1zlKb1TiLDtKNnY8I"
          data-theme="dark"
          data-accent-color="#1E63B5"
          strategy="afterInteractive"
        />
        <Analytics />
      </body>
    </html>
  )
}
