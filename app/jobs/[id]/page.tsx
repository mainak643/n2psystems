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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { jobs } from "@/lib/jobs-data"

export function generateStaticParams() {
  return jobs.map((job) => ({ id: job.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = jobs.find((j) => j.id === id)
  if (!job) return { title: "Job Not Found | N2P Systems" }
  return {
    title: `${job.title} | N2P Systems`,
    description: job.description,
  }
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const job = jobs.find((j) => j.id === id)
  if (!job) notFound()

  return (
    <main>
      {/* Header */}
      <section className="bg-navy pt-28 pb-12 sm:pt-32 sm:pb-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 text-sm text-frost/80 hover:text-frost transition-colors mb-6"
            >
              <ArrowLeft className="size-4" />
              Back to All Jobs
            </Link>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className="bg-signature-blue/20 text-cyan-support border-none font-sans text-xs">
                    {job.domain}
                  </Badge>
                  <Badge className="bg-frost/10 text-frost border-none text-xs">
                    {job.mode}
                  </Badge>
                  <Badge className="bg-frost/10 text-frost border-none text-xs">
                    {job.type}
                  </Badge>
                </div>
                <h1 className="font-sans font-bold text-2xl tracking-tight text-frost sm:text-4xl">
                  {job.title}
                </h1>
                <p className="mt-2 text-lg text-frost/80">{job.company}</p>

                <div className="mt-4 flex flex-wrap gap-5 text-sm text-frost/80">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="size-4" />
                    {job.experience}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="size-4" />
                    {job.salary}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    Posted {job.postedDate}
                  </span>
                </div>
              </div>

              <Link href="/submit-resume">
                <Button
                  size="lg"
                  className="bg-signature-blue text-primary-foreground hover:bg-cyan-support transition-colors rounded-lg px-8 py-6 text-base font-sans font-semibold shrink-0"
                >
                  Apply Now
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Job Content */}
        <section className="py-12 lg:py-16 bg-frost">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Main Content */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                {/* Description */}
                <div className="rounded-xl border border-border bg-card p-5 sm:p-8">
                  <h2 className="font-sans font-bold text-xl text-foreground mb-4">
                    Role Overview
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {/* Responsibilities */}
                <div className="rounded-xl border border-border bg-card p-5 sm:p-8">
                  <h2 className="font-sans font-bold text-xl text-foreground mb-4">
                    Responsibilities
                  </h2>
                  <ul className="flex flex-col gap-3">
                    {job.responsibilities.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-muted-foreground leading-relaxed"
                      >
                        <CheckCircle2 className="size-5 shrink-0 text-tech-green mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Requirements */}
                <div className="rounded-xl border border-border bg-card p-5 sm:p-8">
                  <h2 className="font-sans font-bold text-xl text-foreground mb-4">
                    Required Skills & Qualifications
                  </h2>
                  <ul className="flex flex-col gap-3">
                    {job.requirements.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-muted-foreground leading-relaxed"
                      >
                        <CheckCircle2 className="size-5 shrink-0 text-signature-blue mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sidebar */}
              <div className="flex flex-col gap-6">
                {/* Tech Stack */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-sans font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">
                    Tech Stack
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.techStack.map((tech) => (
                      <Badge
                        key={tech}
                        variant="secondary"
                        className="bg-frost text-foreground border border-border"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Quick Facts */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-sans font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">
                    Quick Facts
                  </h3>
                  <dl className="flex flex-col gap-4">
                    {[
                      { label: "Location", value: job.location },
                      { label: "Employment", value: job.type },
                      { label: "Work Mode", value: job.mode },
                      { label: "Experience", value: job.experience },
                      { label: "Compensation", value: job.salary },
                    ].map((fact) => (
                      <div key={fact.label}>
                        <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                        <dd className="text-sm font-sans font-medium text-foreground mt-0.5">
                          {fact.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Apply CTA */}
                <div className="rounded-xl border border-signature-blue/20 bg-signature-blue/5 p-6">
                  <h3 className="font-sans font-semibold text-foreground mb-2">
                    Interested in this role?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Submit your profile through the relevant application form
                    and our team will review it for matching opportunities.
                  </p>
                  <Link href="/submit-resume" className="w-full">
                    <Button className="w-full bg-signature-blue text-primary-foreground hover:bg-cyan-support transition-colors font-sans font-semibold">
                      Apply Now
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
