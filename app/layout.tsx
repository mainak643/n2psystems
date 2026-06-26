import type { Metadata } from 'next'
import { Inter, Source_Sans_3 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { AIChatWidget } from '@/components/chat/ai-chat-widget'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
  display: 'swap',
})

export const metadata: Metadata = {
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
  openGraph: {
    title: 'N2P Systems | Global Technology Recruitment',
    description:
      'Connecting elite technology professionals with leading companies across Canada, USA, and India.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSans.variable}`}>
      <body className="font-sans antialiased overflow-x-hidden min-h-screen bg-background">
        <Navbar />
        {children}
        <Footer />
        <AIChatWidget />
        <Analytics />
      </body>
    </html>
  )
}
