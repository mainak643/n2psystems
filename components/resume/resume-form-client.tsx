"use client"

import { Suspense, useEffect, useId, useRef, useState, type ComponentType } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bot,
  Boxes,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  CircleDotDashed,
  Cloud,
  Code2,
  Database,
  GitBranch,
  Loader2,
  ShieldCheck,
  Sparkles,
  TestTubeDiagonal,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  FIELD_BORDER,
  FormProgress,
  FormSection,
  INPUT_CLASS,
  loadSavedContact,
  saveContact,
  MAX_BYTES,
  ResumeDropzone,
  TextField,
  extensionOf,
} from "@/components/jobs/apply-form-client"
import { cn } from "@/lib/utils"

type CategoryKey =
  | "softwareDevelopment"
  | "cloudDevOps"
  | "cyberSecurity"
  | "dataEngineeringAnalytics"
  | "testingQA"
  | "technicalLeadership"
  | "architectureRoles"
  | "emergingAIAutomation"
  | "integrationMiddleware"
  | "automationRPA"
  | "enterpriseApplications"
  | "databaseTechnologies"

const CATEGORIES: {
  key: CategoryKey
  name: string
  description: string
  icon: ComponentType<{ className?: string }>
  accent: string
}[] = [
  { key: "softwareDevelopment", name: "Software Development", description: "Frontend, Backend, Full Stack, Java, .NET, Python, React", icon: Code2, accent: "text-tech-green bg-tech-green/10" },
  { key: "cloudDevOps", name: "Cloud & DevOps", description: "AWS, Azure, Kubernetes, Terraform, SRE", icon: Cloud, accent: "text-signature-blue bg-signature-blue/10" },
  { key: "cyberSecurity", name: "Cyber Security", description: "SOC, IAM, Pen Testing, Security Engineering", icon: ShieldCheck, accent: "text-violet-600 bg-violet-50" },
  { key: "dataEngineeringAnalytics", name: "Data Engineering & Analytics", description: "ETL, BI, Snowflake, Databricks, Power BI", icon: BarChart3, accent: "text-orange-600 bg-orange-50" },
  { key: "testingQA", name: "Testing & Quality Assurance", description: "Manual Testing, Automation Testing, SDET", icon: TestTubeDiagonal, accent: "text-sky-600 bg-sky-50" },
  { key: "technicalLeadership", name: "Technical Leadership", description: "Engineering Management, Delivery Leadership, CTO, VP Engineering", icon: BriefcaseBusiness, accent: "text-signature-blue bg-signature-blue/10" },
  { key: "architectureRoles", name: "Architecture Roles", description: "Solution, Enterprise, Cloud, Data, Security Architecture", icon: Boxes, accent: "text-violet-600 bg-violet-50" },
  { key: "emergingAIAutomation", name: "Emerging AI & Automation", description: "GenAI, ML Engineering, Intelligent Automation, AI Platforms", icon: Bot, accent: "text-fuchsia-600 bg-fuchsia-50" },
  { key: "integrationMiddleware", name: "Integration & Middleware", description: "MuleSoft, API Management, Kafka, ESB, iPaaS", icon: GitBranch, accent: "text-amber-600 bg-amber-50" },
  { key: "automationRPA", name: "Automation & RPA", description: "UiPath, Blue Prism, Power Automate, Process Automation", icon: CircleDotDashed, accent: "text-tech-green bg-tech-green/10" },
  { key: "enterpriseApplications", name: "Enterprise Applications", description: "SAP, Oracle, Salesforce, Dynamics, ServiceNow", icon: BriefcaseBusiness, accent: "text-sky-600 bg-sky-50" },
  { key: "databaseTechnologies", name: "Database Technologies", description: "DBA, SQL Server, Oracle, PostgreSQL, MongoDB", icon: Database, accent: "text-blue-600 bg-blue-50" },
]

/**
 * Maps a free-text department (`?category=`) or job title (`?role=`) onto a
 * category, for candidates arriving from a job posting.
 *
 * Every pattern is word-boundary anchored — unbounded substring tests used to
 * match inside words ("IT" in secur-it-y, "ml" in ht-ml, "ai" in em-ai-l) and
 * pre-select the wrong specialisation. Order matters: first match wins, so the
 * specific categories come first and software development is the catch-all.
 */
const CATEGORY_PATTERNS: { key: CategoryKey; pattern: RegExp }[] = [
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
    pattern: /\b(software|developer|engineer|full[ -]?stack|front[ -]?end|back[ -]?end|java|\.net|dotnet|python|react|angular|node|web|computer science)\b/i,
  },
]

function matchCategory(text: string | null | undefined): CategoryKey | undefined {
  const value = text?.trim()
  if (!value) return undefined
  return CATEGORY_PATTERNS.find(({ pattern }) => pattern.test(value))?.key
}

const WORK_MODES = ["Remote", "Hybrid", "Onsite", "Flexible"] as const

type Field =
  | "fullName"
  | "email"
  | "phone"
  | "location"
  | "linkedinUrl"
  | "currentTitle"
  | "currentCompany"
  | "experienceYears"
  | "noticePeriod"
  | "skills"
  | "workAuthorization"
  | "summary"

const EMPTY: Record<Field, string> = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedinUrl: "",
  currentTitle: "",
  currentCompany: "",
  experienceYears: "",
  noticePeriod: "",
  skills: "",
  workAuthorization: "",
  summary: "",
}

type ErrorKey = Field | "category" | "resume" | "consent"

function validate(values: Record<Field, string>, category: CategoryKey | null, file: File | null, consent: boolean) {
  const errors: Partial<Record<ErrorKey, string>> = {}
  if (!category) errors.category = "Please choose your specialisation."
  if (values.fullName.trim().length < 2) errors.fullName = "Please enter your full name."
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Please enter a valid email address."
  const phone = values.phone.replace(/[\s().-]/g, "")
  if (!values.phone.trim()) errors.phone = "Please enter your phone number."
  else if (!/^\+?[0-9]{7,20}$/.test(phone)) errors.phone = "Please enter a valid phone number."
  if (values.location.trim().length < 2) errors.location = "Please enter your current location."
  const linkedin = values.linkedinUrl.trim().toLowerCase()
  if (linkedin && !linkedin.includes("linkedin.com/")) {
    errors.linkedinUrl = "That doesn't look like a LinkedIn URL. Leave it blank if you don't have one."
  }
  if (values.experienceYears.trim()) {
    const years = Number(values.experienceYears)
    if (!Number.isFinite(years) || years < 0 || years > 60) errors.experienceYears = "Enter a number of years between 0 and 60."
  } else {
    errors.experienceYears = "Please enter your years of experience."
  }
  if (!file) errors.resume = "Please attach your resume."
  else if (file.size > MAX_BYTES) errors.resume = "That file is over 2 MB. Please attach a smaller PDF or DOCX."
  else if (!["pdf", "docx"].includes(extensionOf(file))) errors.resume = "Please upload your resume as a PDF or DOCX file."
  if (!consent) errors.consent = "Please agree to the privacy policy to continue."
  return errors
}

function ResumeFormInner() {
  const formId = useId()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get("role")
  const reqParam = searchParams.get("req")
  const categoryParam = searchParams.get("category")

  const [category, setCategory] = useState<CategoryKey | null>(null)
  const [values, setValues] = useState<Record<Field, string>>(EMPTY)
  const [workMode, setWorkMode] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<ErrorKey, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [state, setState] = useState<"idle" | "submitting" | "done">("idle")
  const [errorSeq, setErrorSeq] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const errorSummaryRef = useRef<HTMLDivElement | null>(null)
  const successRef = useRef<HTMLDivElement | null>(null)

  // Arriving from a job posting: pre-select the closest specialisation.
  useEffect(() => {
    const matched = matchCategory(categoryParam) ?? matchCategory(roleParam)
    if (matched) setCategory(matched)
    else if (roleParam) setCategory("softwareDevelopment")
  }, [categoryParam, roleParam])

  useEffect(() => {
    if (errorSeq > 0) errorSummaryRef.current?.focus()
  }, [errorSeq])

  useEffect(() => {
    if (state === "done") successRef.current?.focus()
  }, [state])

  // Pre-fill contact details from a previous application in this browser.
  useEffect(() => {
    const saved = loadSavedContact()
    if (saved) {
      setValues((prev) => {
        const next = { ...prev }
        for (const [k, v] of Object.entries(saved)) if (v && !next[k as Field]) next[k as Field] = v
        return next
      })
    }
  }, [])

  const fieldId = (f: string) => `${formId}-${f}`
  const errorId = (f: string) => `${formId}-${f}-error`

  const set = (f: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((prev) => ({ ...prev, [f]: e.target.value }))
    setErrors((prev) => (prev[f] ? { ...prev, [f]: undefined } : prev))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const found = validate(values, category, file, consent)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      setErrorSeq((n) => n + 1)
      return
    }

    setState("submitting")
    try {
      const selected = CATEGORIES.find((c) => c.key === category)!
      // A candidate who came from a specific posting: keep that context with
      // the profile so the recruiter reviewing it knows what brought them in.
      const origin = roleParam ? `Interested in: ${roleParam}${reqParam ? ` (${reqParam})` : ""}` : ""
      const summary = [origin, values.summary.trim()].filter(Boolean).join("\n\n")

      const payload = new FormData()
      payload.set("category", selected.name)
      payload.set("fullName", values.fullName.trim())
      payload.set("email", values.email.trim().toLowerCase())
      payload.set("phone", values.phone.trim())
      payload.set("location", values.location.trim())
      payload.set("linkedinUrl", values.linkedinUrl.trim())
      payload.set("currentTitle", values.currentTitle.trim())
      payload.set("currentCompany", values.currentCompany.trim())
      payload.set("experienceYears", values.experienceYears.trim())
      payload.set("preferredWorkMode", workMode)
      payload.set("noticePeriod", values.noticePeriod.trim())
      payload.set("skills", values.skills)
      payload.set("workAuthorization", values.workAuthorization.trim())
      payload.set("summary", summary.slice(0, 4000))
      payload.set("consent", consent ? "yes" : "")
      payload.set("resume", file!, file!.name)

      const response = await fetch("/api/talent-pool", { method: "POST", body: payload })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || "We could not save your profile. Please try again.")
      }
      saveContact(values)
      setState("done")
    } catch (err) {
      setState("idle")
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setErrorSeq((n) => n + 1)
    }
  }

  if (state === "done") {
    return (
      <div ref={successRef} tabIndex={-1} role="status" aria-live="polite" className="py-6 text-center outline-none sm:py-10">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-tech-green/10 text-tech-green">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </div>
        <h2 className="text-title text-foreground">Profile received</h2>
        <p className="mx-auto mt-2 max-w-md text-body text-muted-foreground">
          Thank you, {values.fullName.trim().split(" ")[0]}. Your profile is with our recruitment team. When a role
          matches your experience, we will contact you by email.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="brand">
            <Link href="/jobs">
              Browse open roles
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const invalid = Object.entries(errors).filter(([, m]) => Boolean(m))
  const live = validate(values, category, file, consent)

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      {roleParam && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm text-foreground">
            You&apos;re sharing your profile with interest in <span className="font-semibold">{roleParam}</span>
            {reqParam ? <span className="font-mono text-xs text-muted-foreground"> · {reqParam}</span> : null}. We&apos;ll
            pass that on to the recruiter.
          </p>
        </div>
      )}

      {(invalid.length > 0 || submitError) && (
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 outline-none"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-600" aria-hidden="true" />
          <div className="text-sm text-rose-800">
            <p className="font-semibold">{submitError ? "We could not submit your profile" : "Please fix the following"}</p>
            {submitError ? (
              <p className="mt-1 leading-relaxed">{submitError}</p>
            ) : (
              <ul className="mt-1.5 flex flex-col gap-1">
                {invalid.map(([f, message]) => (
                  <li key={f}>
                    <a href={`#${fieldId(f)}`} className="underline underline-offset-2 hover:text-rose-950">
                      {message}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <FormProgress
        steps={[
          { id: 1, label: "Specialisation", done: !live.category },
          { id: 2, label: "Details", done: !live.fullName && !live.email && !live.phone && !live.location && !live.linkedinUrl },
          { id: 3, label: "Experience", done: !live.experienceYears },
          { id: 4, label: "Resume", done: !live.resume },
        ]}
      />

      {/* ── 1. Specialisation ── */}
      <FormSection step={1} title="Your specialisation" description="Pick the area closest to your core experience.">
        <fieldset aria-describedby={errors.category ? errorId("category") : undefined}>
          <legend className="sr-only">Specialisation</legend>
          <div id={fieldId("category")} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {CATEGORIES.map(({ key, name, description, icon: Icon, accent }) => {
              const checked = category === key
              return (
                <label
                  key={key}
                  className={cn(
                    "relative flex cursor-pointer items-start gap-3 rounded-xl border bg-background p-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/30",
                    checked
                      ? "border-primary bg-primary/[0.05]"
                      : errors.category
                        ? "border-rose-300"
                        : `${FIELD_BORDER} hover:border-primary/40`
                  )}
                >
                  <input
                    type="radio"
                    name={fieldId("category-radio")}
                    value={key}
                    checked={checked}
                    onChange={() => {
                      setCategory(key)
                      setErrors((prev) => ({ ...prev, category: undefined }))
                    }}
                    className="sr-only"
                  />
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", accent)}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 pr-5">
                    <span className="block text-sm font-semibold text-foreground">{name}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{description}</span>
                  </span>
                  {checked && (
                    <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3 stroke-[3]" aria-hidden="true" />
                    </span>
                  )}
                </label>
              )
            })}
          </div>
          {errors.category && (
            <p id={errorId("category")} className="mt-2 text-xs font-medium text-rose-600">
              {errors.category}
            </p>
          )}
        </fieldset>
      </FormSection>

      {/* ── 2. Contact ── */}
      <FormSection step={2} title="Your details" description="How our recruiters can reach you.">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField id={fieldId("fullName")} errorId={errorId("fullName")} label="Full name" required value={values.fullName} onChange={set("fullName")} error={errors.fullName} autoComplete="name" placeholder="e.g. Sarah Jenkins" />
          <TextField id={fieldId("email")} errorId={errorId("email")} label="Email address" required type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={values.email} onChange={set("email")} error={errors.email} autoComplete="email" placeholder="sarah.jenkins@example.com" />
          <TextField id={fieldId("phone")} errorId={errorId("phone")} label="Phone number" required type="tel" inputMode="tel" value={values.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" placeholder="+1 (555) 234-5678" hint="Include your country code." />
          <TextField id={fieldId("location")} errorId={errorId("location")} label="Current location" required value={values.location} onChange={set("location")} error={errors.location} autoComplete="address-level2" placeholder="City, Country" />
          <div className="sm:col-span-2">
            <TextField id={fieldId("linkedinUrl")} errorId={errorId("linkedinUrl")} label="LinkedIn profile (optional)" type="url" inputMode="url" autoComplete="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={values.linkedinUrl} onChange={set("linkedinUrl")} error={errors.linkedinUrl} placeholder="linkedin.com/in/yourprofile" />
          </div>
        </div>
      </FormSection>

      {/* ── 3. Experience ── */}
      <FormSection step={3} title="Your experience" description="A few facts that help us match you quickly.">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField id={fieldId("currentTitle")} errorId={errorId("currentTitle")} label="Current or most recent title" value={values.currentTitle} onChange={set("currentTitle")} autoComplete="organization-title" placeholder="e.g. Senior Data Engineer" />
          <TextField id={fieldId("currentCompany")} errorId={errorId("currentCompany")} label="Current or most recent company" value={values.currentCompany} onChange={set("currentCompany")} autoComplete="organization" placeholder="e.g. Acme Corp" />
          <TextField id={fieldId("experienceYears")} errorId={errorId("experienceYears")} label="Years of experience" required type="number" inputMode="decimal" min={0} max={60} step={0.5} value={values.experienceYears} onChange={set("experienceYears")} error={errors.experienceYears} placeholder="e.g. 6" />
          <div className="flex flex-col gap-2">
            <label htmlFor={fieldId("workMode")} className="text-sm font-semibold text-foreground">
              Preferred work mode
            </label>
            <select id={fieldId("workMode")} value={workMode} onChange={(e) => setWorkMode(e.target.value)} className={`${INPUT_CLASS} ${FIELD_BORDER}`}>
              <option value="">No preference</option>
              {WORK_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <TextField id={fieldId("noticePeriod")} errorId={errorId("noticePeriod")} label="Notice period" value={values.noticePeriod} onChange={set("noticePeriod")} placeholder="e.g. 30 days, immediate" />
          <TextField id={fieldId("workAuthorization")} errorId={errorId("workAuthorization")} label="Work authorization" value={values.workAuthorization} onChange={set("workAuthorization")} placeholder="e.g. Canadian PR, US H-1B, Indian citizen" />
          <div className="sm:col-span-2">
            <TextField id={fieldId("skills")} errorId={errorId("skills")} label="Key skills" value={values.skills} onChange={set("skills")} placeholder="e.g. Python, AWS, Kubernetes, Terraform" hint="Separate skills with commas." />
          </div>
        </div>
      </FormSection>

      {/* ── 4. Resume ── */}
      <FormSection step={4} title="Resume" description="PDF or DOCX, up to 2 MB.">
        <ResumeDropzone
          inputId={fieldId("resume")}
          errorId={errorId("resume")}
          hintId={`${formId}-resume-hint`}
          inputRef={fileInputRef}
          file={file}
          error={errors.resume}
          onFile={(next) => {
            setFile(next)
            setErrors((prev) => ({ ...prev, resume: undefined }))
          }}
        />
        <div className="flex flex-col gap-2">
          <label htmlFor={fieldId("summary")} className="text-sm font-semibold text-foreground">
            Anything else we should know? <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id={fieldId("summary")}
            value={values.summary}
            onChange={set("summary")}
            rows={4}
            maxLength={3500}
            placeholder="Roles you're targeting, preferred locations, salary expectations…"
            className={`${INPUT_CLASS} ${FIELD_BORDER} h-auto py-3`}
          />
        </div>
      </FormSection>

      <div className="flex flex-col gap-5 border-t border-border pt-6">
        <label htmlFor={fieldId("consent")} className="flex cursor-pointer items-start gap-3">
          <input
            id={fieldId("consent")}
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked)
              setErrors((prev) => ({ ...prev, consent: undefined }))
            }}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? errorId("consent") : undefined}
            className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
          />
          <span className="text-sm leading-relaxed text-muted-foreground">
            I agree that N2P Systems may store my profile and contact me about relevant roles, as described in the{" "}
            <Link href="/privacy-policy" className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors.consent && (
          <p id={errorId("consent")} className="-mt-3 text-xs font-medium text-rose-600">
            {errors.consent}
          </p>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-tech-green" aria-hidden="true" />
            Shared only with the N2P recruitment team.
          </p>
          <Button type="submit" variant="brand" size="lg" disabled={state === "submitting"} className="w-full shrink-0 sm:w-auto sm:min-w-48">
            {state === "submitting" ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Submitting…
              </>
            ) : (
              <>
                Submit profile
                <ArrowRight className="size-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

export function ResumeFormClient() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Loading…</div>}>
      <ResumeFormInner />
    </Suspense>
  )
}
