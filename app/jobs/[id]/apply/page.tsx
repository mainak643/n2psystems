import { cache } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Briefcase, Building2, MapPin } from "lucide-react"

import { ApplyFormClient, ApplyUnavailable } from "@/components/jobs/apply-form-client"
import { fetchJobById } from "@/lib/jobs-service"

export const revalidate = 60

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
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-[#07101f] pb-12 pt-24 text-white sm:pb-16 sm:pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0e1e38_0%,transparent_70%)] opacity-60" />
        <div className="texture-dots pointer-events-none absolute inset-0 opacity-20" />

        <div className="relative mx-auto max-w-3xl px-5 sm:px-6 lg:px-8">
          <Link
            href={`/jobs/${encodeURIComponent(job.id)}`}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to role details
          </Link>

          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-tech-green">
            Application
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-[1.15] tracking-tight sm:text-4xl">
            {job.title}
          </h1>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300 sm:gap-6">
            <span className="flex items-center gap-1.5">
              <Building2 className="size-4 text-slate-400" />
              {job.company}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 text-slate-400" />
              {job.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="size-4 text-slate-400" />
              {job.experience}
            </span>
            <span className="font-mono text-xs text-slate-400">Ref: {job.id}</span>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-8">
          {job.requirementUuid ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
              <ApplyFormClient job={job} />
            </div>
          ) : (
            <ApplyUnavailable job={job} />
          )}
        </div>
      </section>
    </main>
  )
}
