import type { Metadata } from "next"
import { BookOpen, FileText, ClipboardList, AlertCircle } from "lucide-react"
import { LegalPage } from "@/components/legal/legal-page"

export const metadata: Metadata = {
  title: "Terms of Service | N2P Systems",
  description:
    "Review the Terms of Service governing the use of N2P Systems' website, recruitment consulting, and staffing services.",
  alternates: {
    canonical: "/terms-of-service",
  },
}

export default function TermsOfServicePage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="Last Updated: June 26, 2026"
      intro="Welcome to N2P Systems. Please read these Terms of Service carefully before accessing our website or utilizing our professional placement, staffing, and technology consulting services."
      sections={[
        {
          icon: BookOpen,
          title: "1. Acceptance of Terms",
          content: (
            <p>
              By accessing or using the website of N2P Systems ("we," "us," or "our") or engaging with our recruitment and consulting services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our website or services.
            </p>
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
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
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
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
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
      ]}
      closingTitle="5. Contact Us"
      closingContent={
        <>
          <p>
            N2P Systems reserves the right to modify these Terms of Service at any time. Changes will take effect immediately upon being posted on this page. Your continued use of the website or services constitutes acceptance of the revised terms.
          </p>
          <p>If you have any questions or require clarification regarding these terms, please contact us:</p>
          <div className="surface mt-4 max-w-md p-6">
            <p className="text-subtitle text-foreground">N2P Systems Legal Department</p>
            <p className="mt-1 text-caption">
              Email: <a href="mailto:info@n2psystems.ca" className="text-primary hover:underline">info@n2psystems.ca</a>
            </p>
            <p className="text-caption">Address: 200 Bay Street, Suite 1800, Toronto, ON M5J 2J2, Canada</p>
          </div>
        </>
      }
    />
  )
}
