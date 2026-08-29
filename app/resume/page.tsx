import type { Metadata } from "next"
import { ShieldCheck } from "lucide-react"

import { ResumeFormClient } from "@/components/resume/resume-form-client"
import { PageHero } from "@/components/ui/page-hero"
import { Section } from "@/components/ui/section"

export const metadata: Metadata = {
  title: "Submit Your Profile | N2P Systems",
  description:
    "Select the role category that best matches your experience and complete the relevant N2P Systems application form.",
  alternates: {
    canonical: '/resume',
  },
}

export default function SubmitResumePage() {
  return (
    <main>
      <PageHero
        eyebrow="Careers with N2P"
        badge={
          <div className="pill border-on-dark-line-strong bg-on-dark-fill text-on-dark shadow-e2 backdrop-blur">
            <ShieldCheck className="size-4 text-tech-green" aria-hidden="true" />
            Trusted by talent. Chosen by opportunity.
          </div>
        }
        title="Submit Your Profile for the Right Opportunities"
        description="Select the role category that best matches your expertise. The relevant Google Forms application link will appear below."
      />

      <Section tone="frost" pad="compact">
        <ResumeFormClient />
      </Section>
    </main>
  )
}
