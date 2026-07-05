import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, BookOpen, AlertCircle, FileText, ClipboardList } from "lucide-react"

export const metadata: Metadata = {
  title: "Terms of Service | N2P Systems",
  description:
    "Review the Terms of Service governing the use of N2P Systems' website, recruitment consulting, and staffing services.",
  alternates: {
    canonical: "/terms-of-service",
  },
}

export default function TermsOfServicePage() {
  const sections = [
    {
      icon: BookOpen,
      title: "1. Acceptance of Terms",
      content: (
        <>
          <p>
            By accessing or using the website of N2P Systems ("we," "us," or "our") or engaging with our recruitment and consulting services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our website or services.
          </p>
        </>
      ),
    },
    {
      icon: FileText,
      title: "2. Description of Services",
      content: (
        <>
          <p>
            N2P Systems is a global technology recruitment consultancy and technology advisor helping organizations build high-performing teams, adopt AI, plan cloud transformations, and scale digital systems. We operate in Canada, the United States, and India. Our services include:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1.5 text-muted-foreground">
            <li>Connecting job candidates with prospective employers and contract opportunities.</li>
            <li>Providing technology consulting, AI adoption strategy, and business advisory services.</li>
            <li>Enabling candidates to submit resumes and professional profiles for database inclusion and placement.</li>
          </ul>
        </>
      ),
    },
    {
      icon: ClipboardList,
      title: "3. Candidate and User Responsibilities",
      content: (
        <>
          <p>
            If you submit a resume, profile, or other information to N2P Systems through our forms or email channels, you agree that:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1.5 text-muted-foreground">
            <li>All details provided (employment history, certifications, visa status, etc.) are true, accurate, and complete.</li>
            <li>You will not upload any content that infringes on third-party intellectual property or privacy rights, or contains malicious code.</li>
            <li>We do not guarantee that submitting your profile will result in job placement or interviews.</li>
          </ul>
        </>
      ),
    },
    {
      icon: AlertCircle,
      title: "4. Limitations of Liability and Governing Law",
      content: (
        <>
          <p>
            To the maximum extent permitted by applicable law, N2P Systems shall not be liable for any direct, indirect, incidental, or consequential damages resulting from your use of or inability to use our website, services, or placement channels.
          </p>
          <p className="mt-3">
            These Terms of Service are governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada, without regard to conflict of law principles. Any dispute arising under these terms shall be subject to the exclusive jurisdiction of the courts located in Toronto, Ontario.
          </p>
        </>
      ),
    },
  ]

  return (
    <main className="bg-frost min-h-screen">
      {/* Header Banner */}
      <section className="bg-navy pt-24 pb-10 sm:pt-32 sm:pb-16 relative overflow-hidden texture-dots">
        <div className="absolute -right-20 top-1/4 w-96 h-96 rounded-full bg-signature-blue/5 blur-3xl" />
        <div className="absolute -left-20 bottom-1/4 w-64 h-64 rounded-full bg-tech-green/5 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-widest text-frost/80 hover:text-frost transition-colors mb-6"
          >
            <ArrowLeft className="size-3.5" /> Back to Home
          </Link>
          <h1 className="text-[1.65rem] font-sans font-bold tracking-tight text-frost sm:text-4xl lg:text-5xl leading-[1.15] sm:leading-[1.1]">
            Terms of Service
          </h1>
          <p className="mt-4 text-base text-frost/80 font-serif">
            Last Updated: June 26, 2026
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-10 sm:py-16 md:py-24 bg-card">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">
          <div className="prose max-w-none font-serif text-[15px] leading-relaxed text-muted-foreground space-y-12">
            <div>
              <p className="text-foreground text-lg leading-relaxed font-serif">
                Welcome to N2P Systems. Please read these Terms of Service carefully before 
                accessing our website or utilizing our professional placement, staffing, and 
                technology consulting services.
              </p>
            </div>

            <hr className="border-border" />

            {sections.map((section, index) => (
              <div key={index} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-signature-blue/8 ring-1 ring-signature-blue/10">
                    <section.icon className="size-5 text-signature-blue" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-sans font-bold text-foreground">
                    {section.title}
                  </h2>
                </div>
                <div className="pl-13 text-muted-foreground font-serif text-[15px] leading-relaxed space-y-3">
                  {section.content}
                </div>
              </div>
            ))}

            <hr className="border-border" />

            <div className="space-y-4">
              <h2 className="text-xl font-sans font-bold text-foreground">
                5. Contact Us
              </h2>
              <div className="pl-0 text-muted-foreground font-serif text-[15px] leading-relaxed space-y-4">
                <p>
                  N2P Systems reserves the right to modify these Terms of Service at any time. Changes will take effect immediately upon being posted on this page. Your continued use of the website or services constitutes acceptance of the revised terms.
                </p>
                <p>
                  If you have any questions or require clarification regarding these terms, please contact us:
                </p>
                <div className="rounded-xl border border-border bg-frost p-6 max-w-md mt-4">
                  <p className="font-sans font-semibold text-foreground">N2P Systems Legal Department</p>
                  <p className="text-sm mt-1">Email: <a href="mailto:info@n2psystems.ca" className="text-signature-blue hover:underline">info@n2psystems.ca</a></p>
                  <p className="text-sm">Address: 200 Bay Street, Suite 1800, Toronto, ON M5J 2J2, Canada</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
