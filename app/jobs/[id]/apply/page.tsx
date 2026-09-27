import { cache } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowUpRight, Briefcase, Building2, Clock, Laptop, MapPin, Wallet } from "lucide-react"

import { ApplyFormClient, ApplyUnavailable } from "@/components/jobs/apply-form-client"
import { fetchJobById, fetchPublishedJobs } from "@/lib/jobs-service"
import { PageHero } from "@/components/ui/page-hero"
import { Section } from "@/components/ui/section"

export const revalidate = 60

export async function generateStaticParams() {
  try {
    const jobs = await fetchPublishedJobs()
    return jobs.map((job) => ({ id: job.id }))
  } catch {
    return []
  }
}

const getJob = cache(fetchJobById)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await getJob(id)
  if (!job) return { title: "Job Not Found | N2P Systems" }

  return {
    title: `Apply — ${job.title} | N2P Systems`,
    description: `Submit your resume for ${job.title} at ${job.company}.`,
    // Canonical points at the posting, not this form: the posting carries the
    // JobPosting markup, and a share of this URL should consolidate there.
    alternates: { canonical: `/jobs/${encodeURIComponent(job.id)}` },
    // An application form has nothing to rank for, and indexing it splits
    // authority away from the posting the JobPosting markup lives on.
    robots: { index: false, follow: true },
  }
}

const NEXT_STEPS = [
  {
    title: "Recruiter review",
    body: "The recruitment lead for this role reads your resume and answers against the brief.",
  },
  {
    title: "Intro call",
    body: "If it's a match, we reach out by email or phone to talk through the role and your goals.",
  },
  {
    title: "Client interviews",
    body: "We submit you directly to the hiring manager and prepare you for each round.",
  },
]

export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await getJob(id)
  if (!job) notFound()

  const jobHref = `/jobs/${encodeURIComponent(job.id)}`
  const facts = [
    { icon: MapPin, label: "Location", value: job.location },
    { icon: Laptop, label: "Work mode", value: job.mode },
    { icon: Clock, label: "Employment", value: job.type },
    { icon: Briefcase, label: "Experience", value: job.experience },
    ...(job.salary ? [{ icon: Wallet, label: "Compensation", value: job.salary }] : []),
  ]

  return (
    <main>
      <PageHero
        align="start"
        pad="compact"
        eyebrow="Application"
        title={job.title}
        backLink={{ href: jobHref, label: "Back to role details" }}
        meta={
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-caption text-on-dark-muted sm:gap-x-6">
            <span className="flex items-center gap-1.5">
              <Building2 className="size-4 text-on-dark-subtle" aria-hidden="true" />
              {job.company}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 text-on-dark-subtle" aria-hidden="true" />
              {job.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="size-4 text-on-dark-subtle" aria-hidden="true" />
              {job.experience}
            </span>
            <span className="font-mono text-caption text-on-dark-subtle">Ref: {job.id}</span>
          </div>
        }
      />

      <Section tone="frost" pad="compact">
        {/*
          Form and role summary side by side from lg, spanning the same page
          container as the hero and navbar so all three share one left and
          right edge at every width.
        */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="surface p-5 sm:p-8 lg:p-10">
            {job.requirementUuid ? <ApplyFormClient job={job} /> : <ApplyUnavailable job={job} />}
          </div>

          <aside
            aria-label="Role summary"
            className="flex flex-col gap-6 lg:sticky lg:top-[calc(var(--navbar-h)+1.5rem)]"
          >
            <div className="surface p-6">
              <p className="eyebrow mb-3">You&apos;re applying for</p>
              <p className="text-subtitle text-foreground">{job.title}</p>
              <p className="mt-0.5 text-caption text-muted-foreground">{job.company}</p>

              <dl className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex items-start gap-3">
                    <fact.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                      <dd className="text-sm font-medium text-foreground">{fact.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              <Link
                href={jobHref}
                className="mt-5 inline-flex items-center gap-1 text-caption font-semibold text-primary hover:underline"
              >
                Read the full job description
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>

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
          </aside>
        </div>
      </Section>
    </main>
  )
}
