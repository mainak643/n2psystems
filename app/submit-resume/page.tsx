import type { Metadata } from "next"
import { ShieldCheck } from "lucide-react"

import { ResumeFormClient } from "@/components/resume/resume-form-client"

export const metadata: Metadata = {
  title: "Submit Your Profile | N2P Systems",
  description:
    "Select the role category that best matches your experience and complete the relevant N2P Systems application form.",
}

export default function SubmitResumePage() {
  return (
    <main className="bg-frost">
      <section className="relative overflow-hidden bg-[#071426] pb-12 pt-24 sm:pb-16 md:pb-20 md:pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(34,167,240,0.22),transparent_34%),radial-gradient(circle_at_78%_0%,rgba(122,201,67,0.16),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,transparent_34%,rgba(34,167,240,0.10)_35%,transparent_50%),linear-gradient(300deg,transparent_0%,transparent_42%,rgba(30,99,181,0.16)_43%,transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white shadow-2xl shadow-black/10 backdrop-blur">
              <ShieldCheck className="size-4 text-tech-green" />
              Trusted by talent. Chosen by opportunity.
            </div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-tech-green">
              Careers with N2P
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl text-balance">
              Submit Your Profile for the Right Opportunities
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Select the role category that best matches your expertise. The
              relevant Google Forms application link will appear below.
            </p>
            <div className="mt-6 h-1 w-12 rounded-full bg-tech-green" />
          </div>
        </div>
      </section>

      <section className="relative bg-frost py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ResumeFormClient />
        </div>
      </section>
    </main>
  )
}
