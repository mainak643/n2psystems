import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Shield, Eye, Lock, RefreshCw } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy | N2P Systems",
  description:
    "Learn about how N2P Systems collects, uses, and safeguards personal information for candidates, clients, and website visitors.",
}

export default function PrivacyPolicyPage() {
  const sections = [
    {
      icon: Eye,
      title: "1. Information We Collect",
      content: (
        <>
          <p>
            We collect personal data to provide our recruitment, staffing, and technology consulting services. The types of information we collect include:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1.5 text-muted-foreground">
            <li><strong>Contact Details:</strong> Your name, email address, phone number, and physical address.</li>
            <li><strong>Professional Information:</strong> Your resume, CV, work history, education history, skills, certifications, and LinkedIn profile.</li>
            <li><strong>Work Authorization:</strong> Information regarding your eligibility to work in Canada, the United States, or India.</li>
            <li><strong>Client Information:</strong> Contact information of business representatives, billing details, and service requirements.</li>
            <li><strong>Technical Usage:</strong> IP address, browser type, operating system, and website usage data collected through cookies.</li>
          </ul>
        </>
      ),
    },
    {
      icon: Shield,
      title: "2. How We Use Your Information",
      content: (
        <>
          <p>
            N2P Systems uses the information collected for the following purposes:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1.5 text-muted-foreground">
            <li>To match candidates with active job opportunities and clients' staffing needs.</li>
            <li>To communicate with you regarding application status, new opportunities, or business collaboration.</li>
            <li>To operate, analyze, and improve our website experience and consulting services.</li>
            <li>To manage recruitment pipelines, schedule interviews, and process candidate profiles.</li>
            <li>To comply with regulatory and legal requirements across the jurisdictions we operate in.</li>
          </ul>
        </>
      ),
    },
    {
      icon: Lock,
      title: "3. Information Sharing and Disclosure",
      content: (
        <>
          <p>
            We respect your privacy and do not sell your personal data. We only share information under the following circumstances:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1.5 text-muted-foreground">
            <li><strong>With Clients:</strong> Candidate profiles and resumes are shared with potential employers only after obtaining the candidate's explicit consent.</li>
            <li><strong>Service Providers:</strong> We may share data with trusted third-party providers who perform services on our behalf (e.g., hosting, applicant tracking systems, background checks).</li>
            <li><strong>Legal Demands:</strong> When required by law, subpoena, or government authority in Canada, the US, or India to protect legal rights or safety.</li>
          </ul>
        </>
      ),
    },
    {
      icon: RefreshCw,
      title: "4. Data Security and Retention",
      content: (
        <>
          <p>
            We implement administrative, technical, and physical safeguards designed to protect your personal data against unauthorized access, loss, or alteration. We retain personal data only for as long as necessary to fulfill the purposes outlined in this policy or to satisfy legal, regulatory, or business requirements.
          </p>
        </>
      ),
    },
  ]

  return (
    <main className="bg-frost min-h-screen">
      {/* Header Banner */}
      <section className="bg-navy pt-28 pb-12 sm:pt-32 sm:pb-16 relative overflow-hidden texture-dots">
        <div className="absolute -right-20 top-1/4 w-96 h-96 rounded-full bg-signature-blue/5 blur-3xl" />
        <div className="absolute -left-20 bottom-1/4 w-64 h-64 rounded-full bg-tech-green/5 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-widest text-frost/80 hover:text-frost transition-colors mb-6"
          >
            <ArrowLeft className="size-3.5" /> Back to Home
          </Link>
          <h1 className="text-2xl font-sans font-bold tracking-tight text-frost sm:text-4xl lg:text-5xl leading-[1.15] sm:leading-[1.1]">
            Privacy Policy
          </h1>
          <p className="mt-4 text-base text-frost/80 font-serif">
            Last Updated: June 26, 2026
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24 bg-card">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">
          <div className="prose max-w-none font-serif text-[15px] leading-relaxed text-muted-foreground space-y-12">
            <div>
              <p className="text-foreground text-lg leading-relaxed font-serif">
                At N2P Systems, we are committed to protecting the privacy and security of your personal data. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you visit our website, submit your resume, or utilize our consulting and staffing services.
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
                5. Your Rights and Contact Information
              </h2>
              <div className="pl-0 text-muted-foreground font-serif text-[15px] leading-relaxed space-y-4">
                <p>
                  Depending on your location (Canada, USA, or India), you have certain rights regarding your personal information under local regulations (such as PIPEDA, CCPA, or DPDP Act). These rights may include:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1.5">
                  <li>Requesting access to the personal data we hold about you.</li>
                  <li>Requesting corrections to inaccurate or incomplete information.</li>
                  <li>Requesting deletion of your data when it is no longer needed.</li>
                  <li>Withdrawing your consent to data processing at any time.</li>
                </ul>
                <p className="mt-4">
                  If you have questions about this policy, wish to exercise your rights, or want your resume removed from our pipeline, please contact our privacy officer at:
                </p>
                <div className="rounded-xl border border-border bg-frost p-6 max-w-md mt-4">
                  <p className="font-sans font-semibold text-foreground">N2P Systems Privacy Officer</p>
                  <p className="text-sm mt-1">Email: <a href="mailto:info@n2psystems.com" className="text-signature-blue hover:underline">info@n2psystems.com</a></p>
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
