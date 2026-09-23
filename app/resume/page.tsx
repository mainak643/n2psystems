import type { Metadata } from "next"
import { ShieldCheck } from "lucide-react"

import { ResumeFormClient } from "@/components/resume/resume-form-client"
import { PageHero } from "@/components/ui/page-hero"
import { Section } from "@/components/ui/section"
import { buildBreadcrumbSchema } from "@/lib/seo-schema"

export const metadata: Metadata = {
  title: "Submit Your Profile | N2P Systems",
  description:
    "Select the role category that best matches your experience and complete the relevant N2P Systems application form.",
  alternates: {
    canonical: '/resume',
  },
  openGraph: {
    title: "Submit Your Candidate Profile | N2P Systems",
    description: "Join N2P Systems' premier global technology talent network across Canada, USA, and India.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Submit Your Candidate Profile | N2P Systems",
    description: "Join N2P Systems' premier global technology talent network across Canada, USA, and India.",
  },
}

export default function SubmitResumePage() {
  const breadcrumbs = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Submit Profile", url: "/resume" },
  ])

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbs),
        }}
      />
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
