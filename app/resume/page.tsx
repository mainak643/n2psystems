import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, ShieldCheck } from "lucide-react"

import { ResumeFormClient } from "@/components/resume/resume-form-client"
import { PageHero } from "@/components/ui/page-hero"
import { Section } from "@/components/ui/section"
import { buildBreadcrumbSchema } from "@/lib/seo-schema"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata: Metadata = {
  title: "Submit Your Profile | N2P Systems",
  description:
    "Join the N2P Systems technology talent pool. Share your resume once and our recruiters will match you with roles across Canada, the USA and India.",
  alternates: {
    canonical: '/resume',
  },
  openGraph: {
    title: "Submit Your Candidate Profile | N2P Systems",
    description: "Join N2P Systems' technology talent network across Canada, USA, and India.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Submit Your Candidate Profile | N2P Systems",
    description: "Join N2P Systems' technology talent network across Canada, USA, and India.",
  },
}

const NEXT_STEPS = [
  {
    title: "Recruiter review",
    body: "A recruiter for your specialisation reads your resume and adds you to our talent pool.",
  },
  {
    title: "Matched to roles",
    body: "When a client role fits your experience, we reach out by email or phone before sharing your profile.",
  },
  {
    title: "Interviews",
    body: "We submit you directly to the hiring manager and prepare you for each round.",
  },
]

export default function SubmitResumePage() {
  const breadcrumbs = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Submit Profile", url: "/resume" },
  ])

  return (
    <main>
      <JsonLd data={breadcrumbs} />
      <PageHero
        eyebrow="Careers with N2P"
        badge={
          <div className="pill border-on-dark-line-strong bg-on-dark-fill text-on-dark shadow-e2 backdrop-blur">
            <ShieldCheck className="size-4 text-tech-green" aria-hidden="true" />
            Trusted by talent. Chosen by opportunity.
          </div>
        }
        title="Submit Your Profile for the Right Opportunities"
        description="One short form. Tell us your specialisation, attach your resume, and our recruiters will match you with roles as they open."
      />

      <Section tone="frost" pad="compact">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="surface p-5 sm:p-8 lg:p-10">
            <ResumeFormClient />
          </div>

          <aside aria-label="About the talent pool" className="flex flex-col gap-6 lg:sticky lg:top-[calc(var(--navbar-h)+1.5rem)]">
            <div className="surface p-6">
              <h2 className="text-subtitle text-foreground">What happens next</h2>
              <ol className="mt-4 flex flex-col gap-4">
                {NEXT_STEPS.map((step, i) => (
                  <li key={step.title} className="flex gap-3">
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold tabular-nums text-muted-foreground"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{step.title}</p>
                      <p className="mt-0.5 text-caption text-muted-foreground">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="surface p-6">
              <p className="text-sm font-semibold text-foreground">Looking at a specific role?</p>
              <p className="mt-1 text-caption text-muted-foreground">
                Apply to it directly — your application goes straight to that role&apos;s recruiter.
              </p>
              <Link href="/jobs" className="mt-3 inline-flex items-center gap-1 text-caption font-semibold text-primary hover:underline">
                Browse open roles
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>
      </Section>
    </main>
  )
}
