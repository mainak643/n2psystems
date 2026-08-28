import { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ClipboardCheck, Sparkles, MessageCircle, ShieldCheck } from "lucide-react"
import { JobSearchClient } from "@/components/jobs/job-search-client"
import { fetchPublishedJobs } from "@/lib/jobs-service"
import { buildJobListSchema } from "@/lib/job-schema"

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
}

export default async function JobsPage() {
  const publishedJobs = await fetchPublishedJobs()

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ItemList structured data — surfaces the set of open roles to crawlers. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildJobListSchema(publishedJobs)),
        }}
      />

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-[#07101f] px-5 pt-24 pb-14 sm:pt-32 sm:pb-20 sm:px-6 lg:px-8">
        {/* Ambient Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0e1e38_0%,transparent_70%)] opacity-60" />
        <div className="absolute inset-0 texture-dots opacity-20 pointer-events-none" />

        {/* Clean Hairline */}
        <div
          className="absolute left-0 top-0 h-px w-full pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.05) 70%, transparent)",
          }}
        />

        <div className="relative mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="mb-5 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 sm:px-4 py-1.5 backdrop-blur-sm">
            <Sparkles className="size-3.5 text-tech-green" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-300">
              Active Opportunities
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.15]">
            Explore Open <span className="text-[#3b82f6]">Technology Roles</span>
          </h1>

          {/* Divider */}
          <div className="mx-auto mt-5 sm:mt-6 h-px w-12 sm:w-16 bg-slate-700" />

          {/* Description */}
          <p className="mx-auto mt-5 max-w-2xl text-[15px] sm:text-base leading-relaxed text-slate-300 sm:text-lg">
            Discover verified enterprise engineering, AI/ML, cloud architecture, and technical consulting positions. Apply directly or submit your profile for proactive talent matching.
          </p>

          {/* Quick CTAs */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:gap-4 sm:flex-row w-full sm:w-auto">
            <Link
              href="/resume"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1E63B5] px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#164e93] active:scale-[0.98] sm:w-auto"
            >
              Submit General Profile
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="https://whatsapp.com/channel/0029Vb78hFj2UPB9CHvXxw1P"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-6 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800 hover:text-white active:scale-[0.98] sm:w-auto"
            >
              <MessageCircle className="size-4 text-emerald-400" />
              WhatsApp Role Alerts
            </Link>
          </div>
        </div>
      </section>

      {/* ── Main Opportunities Board ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <JobSearchClient initialJobs={publishedJobs} />
      </section>

      {/* ── Hiring Process Overview ── */}
      <section className="border-t border-slate-200 bg-white py-14 sm:py-20 px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              How N2P Recruitment Works
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              We connect elite engineers directly with high-growth startups and Fortune 500 enterprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 sm:p-8">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-signature-blue/10 text-signature-blue">
                <ClipboardCheck className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">1. Precision Intake & Match</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Our senior technical recruiters analyze your core skills, experience level, and rate expectations to match you with targeted roles.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 sm:p-8">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <ShieldCheck className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">2. Direct Client Submissions</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                No black holes or ghosting. Your verified dossier is submitted directly to the decision-making hiring managers and tech leads.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 sm:p-8">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                <Sparkles className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">3. End-to-End Advisory</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                From interview prep to offer negotiations and onboarding support across Canada, USA, and India.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}