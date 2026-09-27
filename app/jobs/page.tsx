import { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ClipboardCheck, Sparkles, MessageCircle, ShieldCheck } from "lucide-react"
import { JobSearchClient } from "@/components/jobs/job-search-client"
import { fetchPublishedJobs } from "@/lib/jobs-service"
import { buildJobListSchema } from "@/lib/job-schema"
import { buildBreadcrumbSchema } from "@/lib/seo-schema"
import { Button } from "@/components/ui/button"
import { PageHero } from "@/components/ui/page-hero"
import { Section } from "@/components/ui/section"
import { JsonLd } from "@/components/seo/json-ld"
import { FaqSection } from "@/components/seo/faq-section"
import { SITE_URL } from "@/lib/site"
import type { FaqItem } from "@/lib/seo-schema"

/**
 * See the note in app/jobs/[id]/page.tsx — ISR instead of `force-dynamic`. The
 * client subscribes to Supabase realtime for this board, so an open tab still
 * updates the moment a recruiter publishes; this only bounds how stale the
 * first server-rendered paint can be.
 */
export const revalidate = 60

export const metadata: Metadata = {
  title: "Career Opportunities & Tech Roles | N2P Systems",
  description:
    "Explore active technology openings across Software Engineering, Cloud, DevOps, AI/ML, Data Science, and Cybersecurity. Direct placement and contract roles across North America & India.",
  alternates: {
    canonical: '/jobs',
  },
  openGraph: {
    title: "Technology Jobs & Openings | N2P Systems",
    description: "Browse verified engineering, architecture, and consulting positions with N2P Systems.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Technology Jobs & Openings | N2P Systems",
    description: "Browse verified engineering, architecture, and consulting positions with N2P Systems.",
  },
}

/*
  Candidate FAQ. Every answer restates something the site already says or
  does (the apply form's fields and limits, the confirmation message, the
  alert channels) — nothing here promises what the process doesn't deliver.
*/
const CANDIDATE_FAQ: FaqItem[] = [
  {
    question: "How do I apply for a job at N2P Systems?",
    answer:
      "Open any role on this page and select Apply for this Role. The application asks for your name, email, phone, location and LinkedIn profile, your resume as a PDF or DOCX file (up to 2 MB), and any pre-screening questions the hiring team has set for that role.",
  },
  {
    question: "What happens after I submit an application?",
    answer:
      "Your application goes directly to the N2P recruitment lead for that requisition, who reviews it against the role. If it is a fit, we contact you by email to talk through the role and next steps with the hiring team.",
  },
  {
    question: "Can I apply if I don't see a role that matches my skills?",
    answer: `Yes. Submit a general profile at ${SITE_URL}/resume and our recruiters will match you against current and upcoming openings.`,
  },
  {
    question: "Where are N2P Systems jobs located?",
    answer:
      "N2P Systems recruits for technology roles across Canada, the United States and India. Each posting states whether it is remote, hybrid or on-site, and you can filter the board by country, city and work mode.",
  },
  {
    question: "How can I get notified about new job openings?",
    answer: `Follow the N2P Systems WhatsApp channel for role alerts, or subscribe to the jobs RSS feed at ${SITE_URL}/jobs/rss.`,
  },
]

export default async function JobsPage() {
  const publishedJobs = await fetchPublishedJobs()
  const breadcrumbs = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Careers", url: "/jobs" },
  ])

  return (
    <main>
      {/* ItemList structured data — surfaces the set of open roles to crawlers. */}
      <JsonLd data={buildJobListSchema(publishedJobs)} />
      {/* BreadcrumbList structured data */}
      <JsonLd data={breadcrumbs} />

      <PageHero
        width="narrow"
        badge={
          <div className="pill border-on-dark-line-strong bg-on-dark-fill text-on-dark shadow-e2 backdrop-blur">
            <ShieldCheck className="size-4 text-tech-green" aria-hidden="true" />
            Verified Opportunities · Direct Enterprise Placement
          </div>
        }
        eyebrow="Active Opportunities"
        eyebrowIcon={Sparkles}
        title={
          <>
            Explore Open <span className="text-sky-400">Technology Roles</span>
          </>
        }
        description="Discover verified enterprise engineering, AI/ML, cloud architecture, and technical consulting positions. Apply directly or submit your profile for proactive talent matching."
        actions={
          <>
            <Button asChild variant="brand" size="lg">
              <Link href="/resume">
                Submit General Profile
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="on-dark" size="lg">
              <Link
                href="https://whatsapp.com/channel/0029Vb78hFj2UPB9CHvXxw1P"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4 text-emerald-400" aria-hidden="true" />
                WhatsApp Role Alerts
              </Link>
            </Button>
          </>
        }
      />

      {/* ── Main opportunities board ── */}
      <Section tone="frost">
        <JobSearchClient initialJobs={publishedJobs} />
      </Section>

      {/* ── Hiring process overview ── */}
      <Section tone="card" className="border-t border-border">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-heading text-balance text-foreground">How N2P Recruitment Works</h2>
          <p className="mt-3 text-body text-muted-foreground">
            We connect elite engineers directly with high-growth startups and Fortune 500 enterprises.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="surface p-6 sm:p-8">
            <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardCheck className="size-6" aria-hidden="true" />
            </div>
            <h3 className="text-subtitle text-foreground">1. Precision Intake & Match</h3>
            <p className="mt-2.5 text-body text-muted-foreground">
              Our senior technical recruiters analyze your core skills, experience level, and rate expectations to match you with targeted roles.
            </p>
          </div>

          <div className="surface p-6 sm:p-8">
            <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-tech-green/10 text-tech-green">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </div>
            <h3 className="text-subtitle text-foreground">2. Direct Client Submissions</h3>
            <p className="mt-2.5 text-body text-muted-foreground">
              No black holes or ghosting. Your verified dossier is submitted directly to the decision-making hiring managers and tech leads.
            </p>
          </div>

          <div className="surface p-6 sm:p-8">
            <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-cyan-support/10 text-cyan-support">
              <Sparkles className="size-6" aria-hidden="true" />
            </div>
            <h3 className="text-subtitle text-foreground">3. End-to-End Advisory</h3>
            <p className="mt-2.5 text-body text-muted-foreground">
              From interview prep to offer negotiations and onboarding support across Canada, USA, and India.
            </p>
          </div>
        </div>
      </Section>

      <FaqSection id="candidate-faq" eyebrow="For candidates" title="Applying with N2P" items={CANDIDATE_FAQ} tone="frost" />
    </main>
  )
}
