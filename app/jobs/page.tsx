import Link from "next/link"
import { ArrowRight, BellRing, ClipboardCheck, MessageCircle, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Opportunities Coming Soon | N2P Systems",
  description:
    "N2P Systems opportunities page is under development. Submit your resume and follow our WhatsApp channel for active opportunity updates.",
}

export default function JobsPage() {
  return (
    <main className="bg-frost">
      <section className="relative flex min-h-[calc(100vh-80px)] items-center overflow-hidden bg-[#07101f] px-4 pt-28 pb-16 sm:pt-32 sm:pb-20 sm:px-6 lg:px-8">

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
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-300">
                Career Opportunities
              </span>
            </div>

            {/* ── Heading ── */}
            <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Opportunities Page{" "}
              <span className="text-slate-400 font-normal">Under Development</span>
            </h1>

            {/* ── Divider accent ── */}
            <div className="mx-auto mt-8 h-px w-16 bg-slate-700" />

            {/* ── Description ── */}
            <p className="mx-auto mt-6 sm:mt-8 max-w-2xl text-[15px] sm:text-base leading-relaxed text-slate-400 sm:text-lg">
              We are preparing a more structured way to browse active roles. Until then,
              please submit your profile through our resume form or follow our
              WhatsApp channel for immediate opportunity alerts.
            </p>

            {/* ── CTAs ── */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">

              <Link
                href="/submit-resume"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#1E63B5] px-8 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#164e93] sm:w-auto"
              >
                Fill Resume Form
                <ArrowRight className="size-4" />
              </Link>

              <Link
                href="https://whatsapp.com/channel/0029Vb78hFj2UPB9CHvXxw1P"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-800/50 px-8 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800 hover:text-white sm:w-auto"
              >
                Follow WhatsApp Channel
                <MessageCircle className="size-4" />
              </Link>

            </div>
          </div>

          {/* ── Feature cards ── */}
          <div className="mt-16 grid gap-6 sm:grid-cols-2">

            {/* Card 1 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-left transition-colors hover:border-slate-700">
              <div className="mb-5 flex size-12 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                <ClipboardCheck className="size-5" />
              </div>
              <h2 className="text-base font-semibold text-white">Share your profile once</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Our talent team will review your resume and proactively match it with suitable active
                opportunities. No repeated applications required.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-left transition-colors hover:border-slate-700">
              <div className="mb-5 flex size-12 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                <MessageCircle className="size-5" />
              </div>
              <h2 className="text-base font-semibold text-white">Get direct role updates</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
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