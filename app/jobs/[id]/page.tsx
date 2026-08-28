import { cache } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { fetchJobById } from "@/lib/jobs-service"
import { buildJobPostingSchema } from "@/lib/job-schema"

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

  const description = job.description.replace(/\s+/g, " ").trim().slice(0, 160)
  const canonical = `/jobs/${encodeURIComponent(job.id)}`

  return {
    title: `${job.title} | N2P Systems Careers`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${job.title} at ${job.company}`,
      description,
      url: canonical,
      type: "website",
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

  return (
    <main className="min-h-screen bg-slate-50">
      {/* JobPosting structured data — makes the role eligible for Google Jobs. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildJobPostingSchema(job)),
        }}
      />

      {/* ── Header Band ── */}
      <section className="bg-[#07101f] pt-24 pb-12 sm:pt-32 sm:pb-16 text-white relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0e1e38_0%,transparent_70%)] opacity-60" />
        <div className="absolute inset-0 texture-dots opacity-20 pointer-events-none" />

        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 relative">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors mb-6 font-medium"
          >
            <ArrowLeft className="size-4" />
            Back to All Positions
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className="bg-signature-blue/20 text-sky-400 border border-sky-500/20 font-sans text-xs px-3 py-1">
                  {job.domain}
                </Badge>
                <Badge className="bg-white/10 text-slate-200 border-none text-xs px-3 py-1">
                  {job.mode}
                </Badge>
                <Badge className="bg-white/10 text-slate-200 border-none text-xs px-3 py-1">
                  {job.type}
                </Badge>
                <span className="text-xs font-mono text-slate-400 self-center ml-1">
                  ID: {job.id}
                </span>
              </div>

              <h1 className="font-sans font-bold text-2xl tracking-tight text-white sm:text-4xl lg:text-5xl leading-[1.15]">
                {job.title}
              </h1>

              <div className="mt-3 flex items-center gap-2 text-slate-300 font-medium text-base">
                <Building2 className="size-4 text-slate-400" />
                <span>{job.company}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 sm:gap-6 text-sm text-slate-300">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-slate-400" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="size-4 text-slate-400" />
                  {job.experience}
                </span>
                <span className="flex items-center gap-1.5">
                  <DollarSign className="size-4 text-slate-400" />
                  {job.salary}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4 text-slate-400" />
                  Posted {job.postedDate}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link href={applyUrl} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[#1E63B5] text-white hover:bg-[#164e93] transition-colors rounded-xl px-8 py-6 text-base font-semibold shrink-0 active:scale-[0.98] shadow-lg shadow-blue-950/40"
                >
                  Apply for this Role
                  <ArrowRight className="size-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Role Content Section ── */}
      <section className="py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Content (Left 2 cols) */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Role Overview */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="font-sans font-bold text-xl text-slate-900 mb-4">
                  Role Overview
                </h2>
                <div className="text-slate-600 leading-relaxed whitespace-pre-line text-[15px]">
                  {job.description}
                </div>
              </div>

              {/* Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
                  <h2 className="font-sans font-bold text-xl text-slate-900 mb-4">
                    Key Responsibilities
                  </h2>
                  <ul className="flex flex-col gap-3">
                    {job.responsibilities.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-slate-600 leading-relaxed text-[15px]"
                      >
                        <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements & Skills */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
                  <h2 className="font-sans font-bold text-xl text-slate-900 mb-4">
                    Required Skills & Qualifications
                  </h2>
                  <ul className="flex flex-col gap-3">
                    {job.requirements.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-slate-600 leading-relaxed text-[15px]"
                      >
                        <CheckCircle2 className="size-5 shrink-0 text-signature-blue mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar (Right 1 col) */}
            <div className="flex flex-col gap-6">
              {/* Tech Stack */}
              {job.techStack && job.techStack.length > 0 && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500 mb-3">
                    Target Tech Stack
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.techStack.map((tech) => (
                      <Badge
                        key={tech}
                        variant="secondary"
                        className="bg-slate-100 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Facts */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500 mb-4">
                  Quick Details
                </h3>
                <dl className="flex flex-col gap-3.5 divide-y divide-slate-100">
                  {[
                    { label: "Location", value: job.location },
                    { label: "Employment Type", value: job.type },
                    { label: "Work Arrangement", value: job.mode },
                    { label: "Experience Level", value: job.experience },
                    { label: "Compensation", value: job.salary },
                    { label: "Domain Focus", value: job.domain },
                    { label: "Requisition Ref", value: job.id },
                  ].map((fact, idx) => (
                    <div key={fact.label} className={idx > 0 ? "pt-3 flex justify-between items-center" : "flex justify-between items-center"}>
                      <dt className="text-xs text-slate-500">{fact.label}</dt>
                      <dd className="text-sm font-semibold text-slate-900 text-right">
                        {fact.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Apply Card */}
              <div className="rounded-2xl border border-signature-blue/20 bg-gradient-to-b from-blue-50/80 to-white p-6 shadow-sm">
                <h3 className="font-bold text-slate-950 text-lg mb-1.5">
                  Ready to Apply?
                </h3>
                <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                  Submit your resume and contact information. Our recruitment lead for this role will review your dossier and connect with you.
                </p>
                <Link href={applyUrl} className="w-full">
                  <Button className="w-full bg-[#1E63B5] hover:bg-[#164e93] text-white font-semibold py-5 rounded-xl shadow-md active:scale-[0.98]">
                    Apply for this Role
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
