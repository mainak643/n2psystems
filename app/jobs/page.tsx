import Link from "next/link"
import { ArrowRight, BellRing, ClipboardCheck, MessageCircle, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Browse Opportunities | N2P Systems",
  description:
    "Submit your profile to be considered for our exclusive active and upcoming technology roles. Our recruiters will proactively match you with the right opportunities.",
  alternates: {
    canonical: '/jobs',
  },
}

export default function JobsPage() {
  return (
    <main className="bg-frost">
      <section className="relative flex min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)] items-center overflow-hidden bg-[#07101f] px-5 pt-24 pb-12 sm:pt-32 sm:pb-20 sm:px-6 lg:px-8">

        {/* ── Subtle, professional background texture (No orbs/glows) ── */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0e1e38_0%,transparent_70%)] opacity-50" />
        <div className="absolute inset-0 texture-dots opacity-20 pointer-events-none" />

        {/* ── Clean Top Hairline ── */}
        <div className="absolute left-0 top-0 h-px w-full pointer-events-none"
          style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.05) 70%, transparent)" }}
        />

        <div className="relative mx-auto w-full max-w-5xl">
          <div className="mx-auto max-w-3xl text-center">

            {/* ── Badge ── */}
            <div className="mb-5 sm:mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 sm:px-4 py-1.5 backdrop-blur-sm">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-slate-300">
                Career Opportunities
              </span>
            </div>

            {/* ── Heading ── */}
            <h1 className="text-balance text-[1.65rem] font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.15]">
              Opportunities Page{" "}
              <span className="text-slate-400 font-normal">Under Development</span>
            </h1>

            {/* ── Divider accent ── */}
            <div className="mx-auto mt-5 sm:mt-8 h-px w-12 sm:w-16 bg-slate-700" />

            {/* ── Description ── */}
            <p className="mx-auto mt-6 sm:mt-8 max-w-2xl text-[15px] sm:text-base leading-relaxed text-slate-400 sm:text-lg">
              We are preparing a more structured way to browse active roles. Until then,
              please submit your profile through our resume form or follow our
              WhatsApp channel for immediate opportunity alerts.
            </p>

            {/* ── CTAs ── */}
            <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-3 sm:gap-4 sm:flex-row w-full sm:w-auto">

              <Link
                href="/resume"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg sm:rounded-md bg-[#1E63B5] px-6 sm:px-8 text-[15px] sm:text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#164e93] active:scale-[0.98] sm:w-auto"
              >
                Fill Resume Form
                <ArrowRight className="size-4" />
              </Link>

              <Link
                href="https://whatsapp.com/channel/0029Vb78hFj2UPB9CHvXxw1P"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg sm:rounded-md border border-slate-700 bg-slate-800/50 px-6 sm:px-8 text-[15px] sm:text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800 hover:text-white active:scale-[0.98] sm:w-auto"
              >
                Follow WhatsApp Channel
                <MessageCircle className="size-4" />
              </Link>

            </div>
          </div>

          {/* ── Feature cards ── */}
          {/* ↓ Mobile: 2-col with tighter gap + less top margin. sm+ unchanged. */}
          <div className="mt-8 sm:mt-16 grid grid-cols-2 gap-3 sm:gap-6">

            {/* Card 1 */}
            {/* ↓ Mobile: tighter padding */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-8 text-left transition-colors hover:border-slate-700">
              {/* ↓ Mobile: smaller icon container + tighter bottom margin */}
              <div className="mb-3 sm:mb-5 flex size-10 sm:size-12 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                {/* ↓ Mobile: smaller icon */}
                <ClipboardCheck className="size-4 sm:size-5" />
              </div>
              <h2 className="text-base font-semibold text-white">Share your profile once</h2>
              {/* ↓ Mobile: tighter top margin on description */}
              <p className="mt-2 sm:mt-3 text-sm leading-relaxed text-slate-400">
                Our talent team will review your resume and proactively match it with suitable active
                opportunities. No repeated applications required.
              </p>
            </div>

            {/* Card 2 */}
            {/* ↓ Mobile: tighter padding */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-8 text-left transition-colors hover:border-slate-700">
              {/* ↓ Mobile: smaller icon container + tighter bottom margin */}
              <div className="mb-3 sm:mb-5 flex size-10 sm:size-12 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                {/* ↓ Mobile: smaller icon */}
                <MessageCircle className="size-4 sm:size-5" />
              </div>
              <h2 className="text-base font-semibold text-white">Get direct role updates</h2>
              {/* ↓ Mobile: tighter top margin on description */}
              <p className="mt-2 sm:mt-3 text-sm leading-relaxed text-slate-400">
                New and active consulting opportunities are posted directly to our WhatsApp channel
                as soon as they become available.
              </p>
            </div>

          </div>
        </div>
      </section>
    </main>
  )
}