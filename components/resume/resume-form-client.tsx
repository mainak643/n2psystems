"use client"

import { useEffect, useRef, useState, Suspense, type ComponentType } from "react"
import { useSearchParams } from "next/navigation"
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
      accent: "text-sky-600 bg-sky-50",
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
      accent: "text-blue-600 bg-blue-50",
    },
  ]

/**
 * Maps a free-text department (`?category=`) or job title (`?role=`) onto a
 * category form.
 *
 * This replaces two `String.includes()` chains. Unbounded substring tests
 * matched *inside* words, so real traffic landed on the wrong form and the
 * candidate's resume went into the wrong pipeline with nothing on screen to
 * suggest it: department "IT" matched `cybersecurity` (secur-**it**-y), title
 * "HTML Developer" matched `ml` (ht-**ml**), "Mobile Developer" matched `bi`
 * (mo-**bi**-le), "Email Marketing" matched `ai` (em-**ai**-l). Four
 * categories — database, integration, RPA, enterprise apps — were unreachable
 * from the title chain entirely.
 *
 * Every pattern is word-boundary anchored, and order matters: the first match
 * wins, so the specific categories come before the broad ones and
 * `softwareDevelopment` sits last as the catch-all. Tokens are drawn from each
 * category's own description above, so the two stay in step.
 */
const CATEGORY_PATTERNS: { key: CategoryFormKey; pattern: RegExp }[] = [
  // "Solution, Enterprise, Cloud, Data, Security Architecture" — the
  // architecture form owns every architect title, whatever the specialism.
  { key: "architectureRoles", pattern: /\b(architect|architecture)\b/i },
  { key: "cyberSecurity", pattern: /\b(cyber|security|infosec|soc|iam|grc|appsec|pen test(ing)?|penetration)\b/i },
  { key: "testingQA", pattern: /\b(qa|quality assurance|sdet|tester|testing|test engineer)\b/i },
  { key: "automationRPA", pattern: /\b(rpa|uipath|blue prism|automation anywhere|power automate|process automation)\b/i },
  { key: "databaseTechnologies", pattern: /\b(dba|database|sql server|postgres(ql)?|mongo(db)?|mysql|oracle)\b/i },
  { key: "integrationMiddleware", pattern: /\b(integration|middleware|mulesoft|api management|ipaas|esb|tibco|boomi|kafka)\b/i },
  { key: "enterpriseApplications", pattern: /\b(sap|salesforce|servicenow|workday|dynamics|peoplesoft|erp|crm|enterprise applications?)\b/i },
  { key: "emergingAIAutomation", pattern: /\b(ai|ml|genai|llm|machine learning|deep learning|nlp|computer vision|data scien(ce|tist))\b/i },
  { key: "cloudDevOps", pattern: /\b(cloud|devops|sre|aws|azure|gcp|kubernetes|terraform|infrastructure|platform engineer(ing)?)\b/i },
  { key: "dataEngineeringAnalytics", pattern: /\b(data engineer(ing)?|analytics|analyst|bi|business intelligence|etl|snowflake|databricks|data warehouse|big data|spark)\b/i },
  { key: "technicalLeadership", pattern: /\b(director|vp|cto|head of|lead|manager|management|product owner|scrum master|delivery)\b/i },
  {
    key: "softwareDevelopment",
    pattern:
      /\b(software|developer|engineer|full[ -]?stack|front[ -]?end|back[ -]?end|java|\.net|dotnet|python|react|angular|node|web|computer science)\b/i,
  },
]

function matchCategory(text: string | null | undefined): CategoryFormKey | undefined {
  const value = text?.trim()
  if (!value) return undefined
  return CATEGORY_PATTERNS.find(({ pattern }) => pattern.test(value))?.key
}

function ResumeFormInner() {
  const [selectedKey, setSelectedKey] = useState<CategoryFormKey | null>(null)
  const formSectionRef = useRef<HTMLDivElement | null>(null)
  const searchParams = useSearchParams()
  const roleParam = searchParams.get("role")
  const reqParam = searchParams.get("req")
  const categoryParam = searchParams.get("category")

  useEffect(() => {
    // The `category` param carries the requisition's free-text department,
    // which recruiters fill in themselves — live values include "Computer
    // Science" and "IT & Infrastructure", neither of which matches a category
    // name here. This used to be an `else if`, so an unmatched department meant
    // the candidate arrived from "Apply for this Role" with nothing selected
    // and no fallback. Both signals are tried now, category first.
    const matched = matchCategory(categoryParam) ?? matchCategory(roleParam)
    if (matched) {
      setSelectedKey(matched)
      return
    }

    // Neither signal was recognised. Only fall back to the broadest category
    // when the candidate actually arrived from a role — that is the case the
    // note above describes, where landing with nothing selected was the bug.
    // A bare /resume visit keeps the grid open so they choose for themselves.
    if (roleParam) setSelectedKey("softwareDevelopment")
  }, [categoryParam, roleParam])

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
      {/* Role Banner if linked from specific requisition */}
      {roleParam && (
        <div className="rounded-2xl border border-signature-blue/20 bg-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-signature-blue mb-1">
                <Sparkles className="size-3.5" />
                Target Role Application
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {roleParam}
              </h3>
              {reqParam && (
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Requisition Ref: {reqParam}
                </p>
              )}
            </div>
            <span className="rounded-full bg-tech-green/10 text-tech-green border border-tech-green/20 px-3 py-1 text-xs font-semibold self-start sm:self-auto">
              Direct Referral
            </span>
          </div>
        </div>
      )}

      <section>
        <div className="mb-7">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
            1. Choose Your Role Category
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Select the specialization that aligns with your technical capabilities.
          </p>
        </div>

        {/* 2-col grid on mobile, 4-col on lg */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {CATEGORIES.map(({ key, name, description, icon: Icon, accent }) => {
            const selected = selectedKey === key

            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => handleSelect(key)}
                className={cn(
                  "group relative min-h-[140px] sm:min-h-28 h-full overflow-hidden rounded-xl border bg-white p-3 sm:p-4 text-left shadow-sm outline-none",
                  "transition-all duration-300 ease-out hover:-translate-y-1 hover:border-signature-blue/30 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)]",
                  "focus-visible:ring-2 focus-visible:ring-signature-blue/25",
                  selected
                    ? "border-tech-green bg-tech-green/[0.035] shadow-[0_18px_42px_rgba(122,201,67,0.16)]"
                    : "border-slate-200/90"
                )}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-signature-blue via-sky-400 to-tech-green opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {selected && (
                  <div className="absolute right-2 top-2 sm:right-3 sm:top-3 flex size-6 sm:size-7 items-center justify-center rounded-full bg-tech-green text-white shadow-[0_8px_18px_rgba(122,201,67,0.28)]">
                    <Check className="size-3.5 sm:size-4 stroke-[3]" />
                  </div>
                )}

                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:gap-3.5">
                  <div
                    className={cn(
                      "flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105",
                      accent
                    )}
                  >
                    <Icon className="size-4 sm:size-5" />
                  </div>
                  <div className="min-w-0 pr-6 sm:pr-0">
                    <h3 className="text-[13.5px] sm:text-[15px] font-bold leading-snug text-slate-950">
                      {name}
                    </h3>
                    <p className="mt-1 text-[11.5px] sm:text-[12px] leading-relaxed text-slate-500 line-clamp-2 sm:line-clamp-none">
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
                      {roleParam && (
                        <p className="text-xs text-slate-300 mt-1">
                          Applying for: {roleParam}
                        </p>
                      )}
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

export function ResumeFormClient() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-slate-400">Loading form options...</div>}>
      <ResumeFormInner />
    </Suspense>
  )
}