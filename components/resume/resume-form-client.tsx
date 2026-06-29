"use client"

import { useEffect, useRef, useState, type ComponentType } from "react"
import {
  BarChart3,
  Bot,
  Boxes,
  BriefcaseBusiness,
  Check,
  CircleDotDashed,
  Cloud,
  Code2,
  Database,
  ExternalLink,
  GitBranch,
  ShieldCheck,
  Sparkles,
  TestTubeDiagonal,
} from "lucide-react"

import {
  CATEGORY_FORM_MAP,
  type CategoryFormKey,
} from "@/components/resume/categoryForms"
import { cn } from "@/lib/utils"

const CATEGORIES: {
  key: CategoryFormKey
  name: string
  description: string
  icon: ComponentType<{ className?: string }>
  accent: string
}[] = [
    {
      key: "softwareDevelopment",
      name: "Software Development",
      description: "Frontend, Backend, Full Stack, Java, .NET, Python, React",
      icon: Code2,
      accent: "text-tech-green bg-tech-green/10",
    },
    {
      key: "cloudDevOps",
      name: "Cloud & DevOps",
      description: "AWS, Azure, Kubernetes, Terraform, SRE",
      icon: Cloud,
      accent: "text-signature-blue bg-signature-blue/10",
    },
    {
      key: "cyberSecurity",
      name: "Cyber Security",
      description: "SOC, IAM, Pen Testing, Security Engineering",
      icon: ShieldCheck,
      accent: "text-violet-600 bg-violet-50",
    },
    {
      key: "dataEngineeringAnalytics",
      name: "Data Engineering & Analytics",
      description: "ETL, BI, Snowflake, Databricks, Power BI",
      icon: BarChart3,
      accent: "text-orange-600 bg-orange-50",
    },
    {
      key: "testingQA",
      name: "Testing & Quality Assurance",
      description: "Manual Testing, Automation Testing, SDET",
      icon: TestTubeDiagonal,
      accent: "text-cyan-600 bg-cyan-50",
    },
    {
      key: "technicalLeadership",
      name: "Technical Leadership",
      description: "Engineering Management, Delivery Leadership, CTO, VP Engineering",
      icon: BriefcaseBusiness,
      accent: "text-signature-blue bg-signature-blue/10",
    },
    {
      key: "architectureRoles",
      name: "Architecture Roles",
      description: "Solution, Enterprise, Cloud, Data, Security Architecture",
      icon: Boxes,
      accent: "text-violet-600 bg-violet-50",
    },
    {
      key: "emergingAIAutomation",
      name: "Emerging AI & Automation",
      description: "GenAI, ML Engineering, Intelligent Automation, AI Platforms",
      icon: Bot,
      accent: "text-fuchsia-600 bg-fuchsia-50",
    },
    {
      key: "integrationMiddleware",
      name: "Integration & Middleware",
      description: "MuleSoft, API Management, Kafka, ESB, iPaaS",
      icon: GitBranch,
      accent: "text-amber-600 bg-amber-50",
    },
    {
      key: "automationRPA",
      name: "Automation & RPA",
      description: "UiPath, Blue Prism, Power Automate, Process Automation",
      icon: CircleDotDashed,
      accent: "text-tech-green bg-tech-green/10",
    },
    {
      key: "enterpriseApplications",
      name: "Enterprise Applications",
      description: "SAP, Oracle, Salesforce, Dynamics, ServiceNow",
      icon: BriefcaseBusiness,
      accent: "text-sky-600 bg-sky-50",
    },
    {
      key: "databaseTechnologies",
      name: "Database Technologies",
      description: "DBA, SQL Server, Oracle, PostgreSQL, MongoDB",
      icon: Database,
      accent: "text-teal-600 bg-teal-50",
    },
  ]

export function ResumeFormClient() {
  const [selectedKey, setSelectedKey] = useState<CategoryFormKey | null>(null)
  const formSectionRef = useRef<HTMLDivElement | null>(null)

  const selectedCategory = CATEGORIES.find((category) => category.key === selectedKey)
  const formUrl = selectedKey ? CATEGORY_FORM_MAP[selectedKey] : ""

  const handleSelect = (key: CategoryFormKey) => {
    setSelectedKey(key)

    window.setTimeout(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 80)
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-7">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
            1. Choose Your Role Category
          </h2>
        </div>

        {/* ↓ Mobile: 2-col grid with fixed row height so all rows are equal. sm+ unchanged. */}
        <div className="grid grid-cols-2 auto-rows-[8.5rem] gap-2.5 sm:auto-rows-auto sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map(({ key, name, description, icon: Icon, accent }) => {
            const selected = selectedKey === key

            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => handleSelect(key)}
                className={cn(
                  // ↓ Mobile: row height from auto-rows; just needs padding + full height fill
                  "group relative h-full sm:min-h-28 overflow-hidden rounded-xl border bg-white p-3 sm:p-4 text-left shadow-sm outline-none",
                  "transition-all duration-300 ease-out hover:-translate-y-1 hover:border-signature-blue/30 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)]",
                  "focus-visible:ring-2 focus-visible:ring-signature-blue/25",
                  selected
                    ? "border-tech-green bg-tech-green/[0.035] shadow-[0_18px_42px_rgba(122,201,67,0.16)]"
                    : "border-slate-200/90"
                )}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-signature-blue via-cyan-support to-tech-green opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {selected && (
                  <div className="absolute right-2 top-2 sm:right-3 sm:top-3 flex size-6 sm:size-7 items-center justify-center rounded-full bg-tech-green text-white shadow-[0_8px_18px_rgba(122,201,67,0.28)]">
                    <Check className="size-3.5 sm:size-4 stroke-[3]" />
                  </div>
                )}

                {/* ↓ Mobile: stacked (icon above text). sm+: side-by-side. */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div
                    className={cn(
                      // ↓ Mobile: slightly smaller icon circle
                      "flex size-9 sm:size-11 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105",
                      accent
                    )}
                  >
                    {/* ↓ Mobile: slightly smaller icon */}
                    <Icon className="size-4 sm:size-5" />
                  </div>
                  <div className="min-w-0 pr-5">
                    {/* ↓ Mobile: slightly smaller title */}
                    <h3 className="text-[13px] sm:text-[15px] font-bold leading-snug text-slate-950">
                      {name}
                    </h3>
                    {/* ↓ Mobile: tighter top margin + slightly smaller description */}
                    <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-[12px] leading-4 text-slate-500">
                      {description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-5 sm:mt-7 flex items-center justify-center gap-2 text-center text-xs sm:text-sm text-slate-500">
          <ShieldCheck className="size-4 text-slate-500" />
          Your information is secure and will only be used for recruitment
          purposes.
        </div>
      </section>

      {selectedCategory && (
        <section
          ref={formSectionRef}
          className="scroll-mt-24 animate-in fade-in slide-in-from-bottom-3 duration-500"
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
                2. Complete Your Application
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Continue with the application form for your selected category.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm shadow-sm">
              <span className="font-medium text-slate-600">
                Selected Category:
              </span>
              <span className="rounded-full border border-tech-green/20 bg-tech-green/10 px-3 py-1 text-xs font-semibold text-tech-green">
                {selectedCategory.name}
              </span>
            </div>
          </div>

          <div key={selectedKey} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="relative overflow-hidden bg-[#071426] px-5 py-5 text-white sm:px-8 sm:py-7">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(34,167,240,0.22),transparent_34%),radial-gradient(circle_at_88%_0%,rgba(122,201,67,0.18),transparent_30%)]" />
                <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-tech-green">
                      <Check className="size-6 stroke-[3]" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-tech-green">
                        Application Ready
                      </div>
                      <h3 className="mt-2 text-lg sm:text-2xl font-bold tracking-tight">
                        {selectedCategory.name}
                      </h3>
                    </div>
                  </div>

                  <a
                    href={formUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-full bg-tech-green px-5 text-sm font-bold text-[#071426] shadow-[0_10px_26px_rgba(122,201,67,0.26)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-tech-green/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-green/40 active:scale-[0.98]"
                  >
                    Open Application Form
                    <ExternalLink className="size-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-center text-sm text-slate-500">
            <ShieldCheck className="size-4" />
            We respect your privacy. Your data is safe with us.
          </div>
        </section>
      )}
    </div>
  )
}