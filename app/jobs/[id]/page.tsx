import { cache } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  IndianRupee,
  ArrowRight,
  CheckCircle2,
  Building2,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { fetchJobById } from "@/lib/jobs-service"
import { buildJobPostingSchema } from "@/lib/job-schema"
import { buildBreadcrumbSchema } from "@/lib/seo-schema"
import { PageHero } from "@/components/ui/page-hero"
import { Section } from "@/components/ui/section"

/**
 * Revalidate rather than `force-dynamic`. Every crawler hit and every visitor
 * used to open its own Supabase round trip for a page that changes when a
 * recruiter edits a requisition — minutes or days apart, not seconds. The
 * board's realtime channel already pushes live changes to open tabs, so a
 * 60-second window costs nothing a visitor would notice and takes the database
 * out of the critical path for TTFB.
 */
export const revalidate = 60

/**
 * `generateMetadata` and the component both need the job. `cache` collapses
 * them into one query per request instead of two.
 */
const getJob = cache(fetchJobById)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await getJob(id)
  if (!job) return { title: "Job Not Found | N2P Systems" }

  // Build an attractive, structured social preview for WhatsApp, LinkedIn, and Twitter
  const facts = [
    job.location ? `📍 ${job.location}` : '',
    job.experience ? `💼 ${job.experience}` : '',
    job.mode ? `⚡ ${job.mode}` : '',
    job.salary ? `💰 ${job.salary}` : '',
  ].filter(Boolean).join(' · ');

  const summarySource = job.overview || job.responsibilities?.[0] || job.description
  const rawClean = summarySource
    .replace(/^[🚀⚡🔥💼✨\s*#]+/gu, '')
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

  const snippet = rawClean.length > 110
    ? `${rawClean.slice(0, 110).replace(/\s+\S*$/, '')}...`
    : rawClean;

  const description = facts ? `${facts} — ${snippet}` : snippet;
  const canonical = `/jobs/${encodeURIComponent(job.id)}`
  const absoluteJobUrl = `https://www.n2psystems.com/jobs/${encodeURIComponent(job.id)}`
  const absoluteImageUrl = `${absoluteJobUrl}/opengraph-image`

  return {
    title: `${job.title} | N2P Systems Careers`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${job.title} | N2P Systems Careers`,
      description,
      url: absoluteJobUrl,
      siteName: "N2P Systems",
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: `${job.title} — N2P Systems`,
          type: "image/png",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${job.title} | N2P Systems Careers`,
      description,
      images: [absoluteImageUrl],
    },
  }
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const job = await getJob(id)
  if (!job) notFound()

  // A live requisition gets the native form, which files the CV against this
  // req in Supabase. Seed listings have no requirement row to attach to, so
  // they keep the general-profile route.
  const applyUrl = job.requirementUuid
    ? `/jobs/${encodeURIComponent(job.id)}/apply`
    : `/resume?role=${encodeURIComponent(job.title)}&req=${encodeURIComponent(job.id)}&category=${encodeURIComponent(job.domain)}`

  const breadcrumbs = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Careers", url: "/jobs" },
    { name: job.title, url: `/jobs/${encodeURIComponent(job.id)}` },
  ])

  return (
    <main>
      {/* JobPosting structured data — makes the role eligible for Google Jobs. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildJobPostingSchema(job)),
        }}
      />
      {/* BreadcrumbList structured data — enhances Google search result hierarchy */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbs),
        }}
      />

      <PageHero
        align="start"
        backLink={{ href: "/jobs", label: "Back to All Positions" }}
        title={job.title}
        actions={
          <Button asChild variant="brand" size="xl">
            <Link href={applyUrl}>
              Apply for this Role
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        }
        meta={
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border border-sky-500/20 bg-primary/20 px-3 py-1 text-xs text-sky-400">
                {job.domain}
              </Badge>
              <Badge className="border-none bg-white/10 px-3 py-1 text-xs text-on-dark-muted">
                {job.mode}
              </Badge>
              <Badge className="border-none bg-white/10 px-3 py-1 text-xs text-on-dark-muted">
                {job.type}
              </Badge>
              <span className="ml-1 self-center font-mono text-caption text-on-dark-subtle">
                ID: {job.id}
              </span>
            </div>

            <div className="flex items-center gap-2 text-body font-medium text-on-dark-muted">
              <Building2 className="size-4 text-on-dark-subtle" aria-hidden="true" />
              <span>{job.company}</span>
            </div>

            <div className="flex flex-wrap gap-4 text-caption text-on-dark-muted sm:gap-6">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 text-on-dark-subtle" aria-hidden="true" />
                {job.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="size-4 text-on-dark-subtle" aria-hidden="true" />
                {job.experience}
              </span>
              {job.salary ? (
                <span className="flex items-center gap-1.5">
                  {job.salary.includes('₹') ? (
                    <IndianRupee className="size-4 text-on-dark-subtle" aria-hidden="true" />
                  ) : (
                    <DollarSign className="size-4 text-on-dark-subtle" aria-hidden="true" />
                  )}
                  {job.salary}
                </span>
              ) : null}
              <span className="flex items-center gap-1.5">
                <Clock className="size-4 text-on-dark-subtle" aria-hidden="true" />
                Posted {job.postedDate}
              </span>
            </div>
          </div>
        }
      />

      {/* ── Role content ── */}
      <Section tone="frost">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            {/*
              Only the genuinely unique intro prose renders here now — the
              raw `description` used to be dumped verbatim, which meant every
              job page showed literal "## Key Responsibilities" / "- " markdown
              syntax as text, and repeated the same content again in the
              structured cards below. `job.overview` is that same raw text
              minus everything the Key Responsibilities / Required Skills
              cards already cover; it's empty (and this card hidden) when the
              JD has no real intro to show.
            */}
            {job.overview && job.overview.trim() && (
              <div className="surface p-6 sm:p-8">
                <h2 className="text-title text-foreground">Role Overview</h2>
                <div className="mt-4 whitespace-pre-line text-body text-muted-foreground">
                  {job.overview}
                </div>
              </div>
            )}

            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="surface p-6 sm:p-8">
                <h2 className="text-title text-foreground">Key Responsibilities</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {job.responsibilities.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-body text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-tech-green" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.requirements && job.requirements.length > 0 && (
              <div className="surface p-6 sm:p-8">
                <h2 className="text-title text-foreground">Required Skills & Qualifications</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {job.requirements.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-body text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.screeningQuestions && job.screeningQuestions.length > 0 && (
              <div className="surface p-6 sm:p-8">
                <div className="flex items-center gap-2">
                  <HelpCircle className="size-5 text-primary" aria-hidden="true" />
                  <h2 className="text-title text-foreground">Role Pre-Screening Criteria</h2>
                </div>
                <p className="mt-2 text-body text-muted-foreground">
                  Applicants will be asked to answer the following qualifying questions when applying for this position:
                </p>
                <ul className="mt-4 flex flex-col gap-3">
                  {job.screeningQuestions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-body text-muted-foreground">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {job.techStack && job.techStack.length > 0 && (
              <div className="surface p-6">
                <h3 className="eyebrow mb-4">Target Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {job.techStack.map((tech) => (
                    <Badge
                      key={tech}
                      variant="secondary"
                      className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="surface p-6">
              <h3 className="eyebrow mb-4">Quick Details</h3>
              <dl className="flex flex-col divide-y divide-border">
                {[
                  { label: "Location", value: job.location },
                  { label: "Employment Type", value: job.type },
                  { label: "Work Arrangement", value: job.mode },
                  { label: "Experience Level", value: job.experience },
                  ...(job.salary ? [{ label: "Compensation", value: job.salary }] : []),
                  { label: "Domain Focus", value: job.domain },
                  { label: "Requisition Ref", value: job.id },
                ].map((fact, idx, arr) => (
                  <div
                    key={fact.label}
                    className={`flex items-center justify-between ${idx > 0 ? "pt-3.5" : ""} ${idx < arr.length - 1 ? "pb-3.5" : ""}`}
                  >
                    <dt className="text-caption text-muted-foreground">{fact.label}</dt>
                    <dd className="text-right text-body font-semibold text-foreground">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="surface border-primary/20 bg-gradient-to-b from-primary/[0.06] to-card p-6">
              <h3 className="text-subtitle text-foreground">Ready to Apply?</h3>
              <p className="mb-5 mt-1.5 text-body text-muted-foreground">
                Submit your resume and contact information. Our recruitment lead for this role will review your dossier and connect with you.
              </p>
              <Button asChild variant="brand" size="lg" className="w-full">
                <Link href={applyUrl}>Apply for this Role</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </main>
  )
}
