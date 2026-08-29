import type { Metadata } from "next"
import { Eye, Shield, Lock, RefreshCw } from "lucide-react"
import { LegalPage } from "@/components/legal/legal-page"

export const metadata: Metadata = {
  title: "Privacy Policy | N2P Systems",
  description:
    "Learn about how N2P Systems collects, uses, and safeguards personal information for candidates, clients, and website visitors.",
  alternates: {
    canonical: "/privacy-policy",
  },
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="Last Updated: June 26, 2026"
      intro="At N2P Systems, we are committed to protecting the privacy and security of your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, submit your resume, or utilize our consulting and staffing services."
      sections={[
        {
          icon: Eye,
          title: "1. Information We Collect",
          content: (
            <>
              <p>
                We collect personal data to provide our recruitment, staffing, and technology consulting services. The types of information we collect include:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li><strong className="text-foreground">Contact Details:</strong> Your name, email address, phone number, and physical address.</li>
                <li><strong className="text-foreground">Professional Information:</strong> Your resume, CV, work history, education history, skills, certifications, and LinkedIn profile.</li>
                <li><strong className="text-foreground">Work Authorization:</strong> Information regarding your eligibility to work in Canada, the United States, or India.</li>
                <li><strong className="text-foreground">Client Information:</strong> Contact information of business representatives, billing details, and service requirements.</li>
                <li><strong className="text-foreground">Technical Usage:</strong> IP address, browser type, operating system, and website usage data collected through cookies.</li>
              </ul>
            </>
          ),
        },
        {
          icon: Shield,
          title: "2. How We Use Your Information",
          content: (
            <>
              <p>N2P Systems uses the information collected for the following purposes:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
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
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li><strong className="text-foreground">With Clients:</strong> Candidate profiles and resumes are shared with potential employers only after obtaining the candidate's explicit consent.</li>
                <li><strong className="text-foreground">Service Providers:</strong> We may share data with trusted third-party providers who perform services on our behalf (e.g., hosting, applicant tracking systems, background checks).</li>
                <li><strong className="text-foreground">Legal Demands:</strong> When required by law, subpoena, or government authority in Canada, the US, or India to protect legal rights or safety.</li>
              </ul>
            </>
          ),
        },
        {
          icon: RefreshCw,
          title: "4. Data Security and Retention",
          content: (
            <p>
              We implement administrative, technical, and physical safeguards designed to protect your personal data against unauthorized access, loss, or alteration. We retain personal data only for as long as necessary to fulfill the purposes outlined in this policy or to satisfy legal, regulatory, or business requirements.
            </p>
          ),
        },
      ]}
      closingTitle="5. Your Rights and Contact Information"
      closingContent={
        <>
          <p>
            Depending on your location (Canada, USA, or India), you have certain rights regarding your personal information under local regulations (such as PIPEDA, CCPA, or DPDP Act). These rights may include:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Requesting access to the personal data we hold about you.</li>
            <li>Requesting corrections to inaccurate or incomplete information.</li>
            <li>Requesting deletion of your data when it is no longer needed.</li>
            <li>Withdrawing your consent to data processing at any time.</li>
          </ul>
          <p className="mt-4">
            If you have questions about this policy, wish to exercise your rights, or want your resume removed from our pipeline, please contact our privacy officer at:
          </p>
          <div className="surface mt-4 max-w-md p-6">
            <p className="text-subtitle text-foreground">N2P Systems Privacy Officer</p>
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
