import { cache } from "react"
import { notFound } from "next/navigation"
import { Briefcase, Building2, MapPin } from "lucide-react"

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
    alternates: { canonical: `/jobs/${encodeURIComponent(job.id)}/apply` },
    // An application form has nothing to rank for, and indexing it splits
    // authority away from the posting the JobPosting markup lives on.
    robots: { index: false, follow: true },
  }
}

export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await getJob(id)
  if (!job) notFound()

  return (
    <main>
      <PageHero
        align="start"
        width="narrow"
        eyebrow="Application"
        title={job.title}
        backLink={{ href: `/jobs/${encodeURIComponent(job.id)}`, label: "Back to role details" }}
        meta={
          <div className="flex flex-wrap gap-4 text-caption text-on-dark-muted sm:gap-6">
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

      <Section tone="frost" pad="compact" width="narrow">
        {job.requirementUuid ? (
          <div className="surface p-6 sm:p-8">
            <ApplyFormClient job={job} />
          </div>
        ) : (
          <ApplyUnavailable job={job} />
        )}
      </Section>
    </main>
  )
}
