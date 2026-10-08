"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { AlertCircle, ArrowRight, CheckCircle2, FileText, Loader2, Paperclip, ShieldCheck, UploadCloud, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Job } from "@/lib/jobs-data"

/**
 * The fields this form reads. Props to a Client Component are serialized into
 * the page's ISR output, so the apply page passes only these, not the full Job.
 */
export type ApplyJob = Pick<Job, "id" | "title" | "domain" | "requirementUuid" | "screeningQuestions" | "screeningQuestionTypes">

/** Mirrors /api/apply, which enforces it. Checked here so the message comes early. */
export const MAX_BYTES = 2 * 1024 * 1024

/** Budget for `job_applications.cover_note`. Screening answers get it first. */
const COVER_NOTE_MAX_CHARS = 4000
const ACCEPTED = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
} as const

type Field = "fullName" | "email" | "phone" | "location" | "linkedinUrl"

const EMPTY: Record<Field, string> = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedinUrl: "",
}

/**
 * The extension, lowercased. Checked instead of `File.type`, which browsers
 * leave empty often enough (drag-and-drop, some Linux desktops) that trusting
 * it would reject a legitimate CV. The server checks the actual bytes.
 */
export function extensionOf(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? ""
}

/**
 * The input for a screening question.
 *
 * The recruiter's own choice wins: the ATS stores an answer type per question
 * (Yes/No, Number, Free text), carried here as `job.screeningQuestionTypes`.
 * Only when a question has none (older requisitions stored plain strings) is
 * the kind read from the question text itself. Two shapes cover what
 * recruiters actually write:
 *
 *  - A "years" threshold ("Do you have 5+ years...", "How many years...")
 *    gets a number input. Even when phrased as "do you have X+", what a
 *    recruiter screens on is the actual number, not a boundary yes/no.
 *  - Everything else that opens with a yes/no auxiliary verb ("Are you...",
 *    "Can you...", "Have you...") gets a Yes/No control instead of a free
 *    text field that collects "yes"/"Yes"/"y"/a full sentence for the same
 *    answer.
 *
 * Anything that doesn't match either pattern keeps the original free-text
 * input — open-ended questions still need one.
 */
type QuestionKind = "boolean" | "numeric" | "text"

const KIND_FOR_TYPE = { yes_no: "boolean", numeric: "numeric", text: "text" } as const

function screeningQuestionKind(question: string, type: keyof typeof KIND_FOR_TYPE | null | undefined): QuestionKind {
  return type ? KIND_FOR_TYPE[type] : classifyScreeningQuestion(question)
}

function classifyScreeningQuestion(question: string): QuestionKind {
  const q = question.trim().toLowerCase()
  if (/\d+\+?\s*years?\b/.test(q) || /\bhow many\b/.test(q)) return "numeric"
  if (/^(are|is|do|does|did|have|has|had|can|could|will|would|should|were|was)\b/.test(q)) return "boolean"
  return "text"
}

function validate(values: Record<Field, string>, file: File | null) {
  const errors: Partial<Record<Field | "resume", string>> = {}

  if (values.fullName.trim().length < 2) {
    errors.fullName = "Please enter your full name."
  }

  // Deliberately permissive — the database CHECK is the real gate, and an
  // over-strict pattern rejects valid addresses.
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    errors.email = "Please enter a valid email address."
  }

  const cleanedPhone = values.phone.replace(/[\s().-]/g, "")
  if (!values.phone.trim()) {
    errors.phone = "Please enter your phone number."
  } else if (cleanedPhone.length < 7 || !/^\+?[0-9]{7,20}$/.test(cleanedPhone)) {
    errors.phone = "Please enter a valid phone number."
  }

  if (values.location.trim().length < 2) {
    errors.location = "Please enter your current location."
  }

  const trimmedLinkedIn = values.linkedinUrl.trim().toLowerCase()
  if (!trimmedLinkedIn) {
    errors.linkedinUrl = "Please enter your LinkedIn profile URL."
  } else if (!trimmedLinkedIn.includes("linkedin.com/")) {
    errors.linkedinUrl = "Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/yourprofile)."
  }

  if (!file) {
    errors.resume = "Please attach your resume."
  } else if (file.size > MAX_BYTES) {
    errors.resume = "That file is over 2 MB. Please attach a smaller PDF or DOCX."
  } else if (!["pdf", "docx"].includes(extensionOf(file))) {
    errors.resume = "Please upload your resume/CV as a PDF or DOCX file."
  }

  return errors
}

export function ApplyFormClient({ job }: { job: ApplyJob }) {
  const formId = useId()
  const [values, setValues] = useState<Record<Field, string>>(EMPTY)
  const [screeningAnswers, setScreeningAnswers] = useState<Record<number, string>>({})
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Partial<Record<Field | "resume", string>>>({})
  const [screeningErrors, setScreeningErrors] = useState<Record<number, string>>({})
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "done">("idle")
  const [submitPhase, setSubmitPhase] = useState<"uploading" | "recording">("uploading")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const errorSummaryRef = useRef<HTMLDivElement | null>(null)
  const successRef = useRef<HTMLDivElement | null>(null)
  /*
    Bumped every time a failed submit produces errors, so the effect below
    can focus the summary once it has actually mounted. The old code called
    errorSummaryRef.current?.focus() in the same tick as setErrors() — but
    the summary only renders when invalidFields.length > 0, so on the FIRST
    failed submit the ref was still null and the focus call silently no-oped.
    It only worked from the second failed submit onward, once the node
    already existed from the previous render.
  */
  const [errorSeq, setErrorSeq] = useState(0)

  useEffect(() => {
    if (errorSeq > 0) errorSummaryRef.current?.focus()
  }, [errorSeq])

  // Move focus to the confirmation so screen reader users are told the
  // application actually went through, instead of being left on a button
  // that just got unmounted.
  useEffect(() => {
    if (submitState === "done") successRef.current?.focus()
  }, [submitState])

  const set = (field: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const handleScreeningChange = (index: number, val: string) => {
    setScreeningAnswers((prev) => ({ ...prev, [index]: val }))
    setScreeningErrors((prev) => {
      if (!prev[index]) return prev
      const next = { ...prev }
      delete next[index]
      return next
    })
  }

  const fieldId = (field: string) => `${formId}-${field}`
  const errorId = (field: string) => `${formId}-${field}-error`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const found = validate(values, file)
    const sErrors: Record<number, string> = {}
    if (job.screeningQuestions && job.screeningQuestions.length > 0) {
      job.screeningQuestions.forEach((_, idx) => {
        if (!screeningAnswers[idx] || !screeningAnswers[idx].trim()) {
          sErrors[idx] = "Please answer this screening question."
        }
      })
    }

    if (Object.keys(found).length > 0 || Object.keys(sErrors).length > 0) {
      setErrors(found)
      setScreeningErrors(sErrors)
      setErrorSeq((n) => n + 1)
      return
    }

    setSubmitState("submitting")
    setSubmitPhase("uploading")
    const phaseTimer = setTimeout(() => {
      setSubmitPhase("recording")
    }, 1500)

    try {
      // Format screening questions & answers cleanly into cover_note
      const formattedScreeningNotes = (job.screeningQuestions || [])
        .map((q, idx) => {
          const a = (screeningAnswers[idx] || "").trim()
          return `Q: ${q}\nA: ${a}`
        })
        .join("\n\n")

      const combinedCoverNote = formattedScreeningNotes
        ? `--- Pre-Screening Questions ---\n${formattedScreeningNotes}`.slice(0, COVER_NOTE_MAX_CHARS)
        : null

      if (!job.requirementUuid) throw new Error("This job posting could not be identified. Please reload the page.")

      let formattedLinkedIn = values.linkedinUrl.trim()
      if (formattedLinkedIn && !/^https?:\/\//i.test(formattedLinkedIn)) {
        formattedLinkedIn = `https://${formattedLinkedIn}`
      }

      // The server validates the file and the fields, uploads and records the
      // application. Nothing here is trusted by it; these are just the values.
      const payload = new FormData()
      payload.set("requirementId", job.requirementUuid)
      payload.set("fullName", values.fullName.trim())
      payload.set("email", values.email.trim().toLowerCase())
      payload.set("phone", values.phone.trim())
      payload.set("location", values.location.trim())
      payload.set("linkedinUrl", formattedLinkedIn)
      payload.set("coverNote", combinedCoverNote ?? "")
      payload.set("resume", file!, file!.name)

      const response = await fetch("/api/apply", { method: "POST", body: payload })
      clearTimeout(phaseTimer)

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || "We could not record your application. Please try again.")
      }

      setSubmitState("done")
    } catch (err) {
      clearTimeout(phaseTimer)
      setSubmitState("idle")
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    }
  }

  if (submitState === "done") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="py-6 text-center outline-none sm:py-10"
      >
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-tech-green/10 text-tech-green">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </div>
        <h2 className="text-title text-foreground">Application received</h2>
        <p className="mx-auto mt-2 max-w-md text-body text-muted-foreground">
          Thank you, {values.fullName.trim().split(" ")[0]}. Your profile for{" "}
          <span className="font-semibold text-foreground">{job.title}</span> is with our recruitment
          lead for this requisition. If it is a fit, we will be in touch by email.
        </p>
        <p className="mt-3 font-mono text-caption text-muted-foreground">Requisition Ref: {job.id}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/jobs">Browse other roles</Link>
          </Button>
        </div>
        {/* LinkedIn Jobs Conversion Event (Completed Application) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src="https://px.ads.linkedin.com/collect/?pid=10047398&fmt=gif"
        />
      </div>
    )
  }

  const invalidFields = Object.entries(errors).filter(([, message]) => Boolean(message))
  const invalidScreeningCount = Object.keys(screeningErrors).length
  const hasScreening = Boolean(job.screeningQuestions && job.screeningQuestions.length > 0)

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      {(invalidFields.length > 0 || invalidScreeningCount > 0 || submitError) && (
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 outline-none"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-600" aria-hidden="true" />
          <div className="text-sm text-rose-800">
            <p className="font-semibold">
              {submitError ? "We could not submit your application" : "Please fix the following"}
            </p>
            {submitError && <p className="mt-1 leading-relaxed">{submitError}</p>}
            {!submitError && (
              /*
                Each entry links to its field, so on a long form (or a phone)
                the applicant can jump straight to what needs fixing instead
                of hunting for the red outline.
              */
              <ul className="mt-1.5 flex flex-col gap-1">
                {invalidFields.map(([field, message]) => (
                  <li key={field}>
                    <a href={`#${fieldId(field)}`} className="underline underline-offset-2 hover:text-rose-950">
                      {message}
                    </a>
                  </li>
                ))}
                {invalidScreeningCount > 0 && (
                  <li>
                    <a
                      href={`#${fieldId(`screening_${Object.keys(screeningErrors)[0]}`)}`}
                      className="underline underline-offset-2 hover:text-rose-950"
                    >
                      Answer {invalidScreeningCount === 1 ? "the remaining pre-screening question" : `the ${invalidScreeningCount} remaining pre-screening questions`}.
                    </a>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ── 1. Contact details ── */}
      <FormSection step={1} title="Your details" description="How the recruitment lead for this role can reach you.">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            id={fieldId("fullName")}
            errorId={errorId("fullName")}
            label="Full name"
            required
            value={values.fullName}
            onChange={set("fullName")}
            error={errors.fullName}
            autoComplete="name"
            placeholder="e.g. Sarah Jenkins"
          />
          <TextField
            id={fieldId("email")}
            errorId={errorId("email")}
            label="Email address"
            required
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={values.email}
            onChange={set("email")}
            error={errors.email}
            autoComplete="email"
            placeholder="sarah.jenkins@example.com"
          />
          <TextField
            id={fieldId("phone")}
            errorId={errorId("phone")}
            label="Phone number"
            required
            type="tel"
            inputMode="tel"
            value={values.phone}
            onChange={set("phone")}
            error={errors.phone}
            autoComplete="tel"
            placeholder="+1 (555) 234-5678"
            hint="Include your country code."
          />
          <TextField
            id={fieldId("location")}
            errorId={errorId("location")}
            label="Current location"
            required
            value={values.location}
            onChange={set("location")}
            error={errors.location}
            placeholder="City, Country"
            autoComplete="address-level2"
          />
          <div className="sm:col-span-2">
            <TextField
              id={fieldId("linkedinUrl")}
              errorId={errorId("linkedinUrl")}
              label="LinkedIn profile"
              required
              type="url"
              inputMode="url"
              autoComplete="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={values.linkedinUrl}
              onChange={set("linkedinUrl")}
              error={errors.linkedinUrl}
              placeholder="linkedin.com/in/yourprofile"
            />
          </div>
        </div>
      </FormSection>

      {/* ── 2. Resume ── */}
      <FormSection step={2} title="Resume" description="PDF or DOCX, up to 2 MB.">
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
      </FormSection>

      {/* ── 3. Role pre-screening ── */}
      {hasScreening && (
        <FormSection
          step={3}
          title="Pre-screening questions"
          description="Short qualifying questions from the hiring team for this role."
        >
          <div className="flex flex-col gap-5">
            {job.screeningQuestions!.map((question, idx) => {
              const qFieldId = fieldId(`screening_${idx}`)
              const qErrorId = errorId(`screening_${idx}`)
              const hasError = Boolean(screeningErrors[idx])
              const kind = screeningQuestionKind(question, job.screeningQuestionTypes?.[idx])

              // Yes/No questions ("Are you authorized to...") get a real
              // two-option control instead of a free-text field, so the
              // stored answer is always exactly "Yes" or "No" — not "yes",
              // "Yep", or a sentence a recruiter then has to interpret.
              if (kind === "boolean") {
                return (
                  <fieldset key={idx} className="flex flex-col gap-2.5">
                    <legend className="mb-2.5 text-sm font-medium leading-snug text-foreground">
                      {question} <span className="text-rose-600" aria-hidden="true">*</span>
                    </legend>
                    <div
                      role="radiogroup"
                      aria-invalid={hasError}
                      aria-describedby={hasError ? qErrorId : undefined}
                      className="grid grid-cols-2 gap-2.5 sm:flex"
                    >
                      {(["Yes", "No"] as const).map((option, optionIdx) => {
                        // The first option carries the question's id so the
                        // error summary's link lands on this group.
                        const optionId = optionIdx === 0 ? qFieldId : `${qFieldId}-${option.toLowerCase()}`
                        const checked = screeningAnswers[idx] === option
                        return (
                          <label
                            key={option}
                            htmlFor={optionId}
                            className={`flex h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold outline-none transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/30 sm:min-w-28 sm:px-8 ${
                              checked
                                ? "border-primary bg-primary/10 text-primary"
                                : hasError
                                  ? "border-rose-300 bg-background text-muted-foreground"
                                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            }`}
                          >
                            <input
                              type="radio"
                              id={optionId}
                              name={qFieldId}
                              value={option}
                              checked={checked}
                              required
                              onChange={() => handleScreeningChange(idx, option)}
                              className="sr-only"
                            />
                            {option}
                          </label>
                        )
                      })}
                    </div>
                    {hasError && (
                      <p id={qErrorId} className="text-xs font-medium text-rose-600">
                        {screeningErrors[idx]}
                      </p>
                    )}
                  </fieldset>
                )
              }

              // Free text: a real multi-line box, since the recruiter asked for
              // an answer in the candidate's own words.
              if (kind === "text") {
                return (
                  <div key={idx} className="flex flex-col gap-2">
                    <label htmlFor={qFieldId} className="text-sm font-medium leading-snug text-foreground">
                      {question} <span className="text-rose-600" aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id={qFieldId}
                      rows={3}
                      required
                      aria-invalid={hasError}
                      aria-describedby={hasError ? qErrorId : undefined}
                      value={screeningAnswers[idx] || ""}
                      onChange={(e) => handleScreeningChange(idx, e.target.value)}
                      placeholder="Your answer"
                      className={`${INPUT_CLASS} h-auto min-h-24 resize-y py-2.5 ${hasError ? "border-rose-300" : "border-border"}`}
                    />
                    {hasError && (
                      <p id={qErrorId} className="text-xs font-medium text-rose-600">
                        {screeningErrors[idx]}
                      </p>
                    )}
                  </div>
                )
              }

              // "5+ years", "How many years..." — what a recruiter actually
              // screens on is the number, so this gets a numeric input
              // rather than forcing a yes/no on a threshold question.
              const isNumeric = kind === "numeric"

              return (
                <div key={idx} className="flex flex-col gap-2">
                  <label htmlFor={qFieldId} className="text-sm font-medium leading-snug text-foreground">
                    {question} <span className="text-rose-600" aria-hidden="true">*</span>
                  </label>
                  <input
                    id={qFieldId}
                    type={isNumeric ? "number" : "text"}
                    inputMode={isNumeric ? "decimal" : undefined}
                    min={isNumeric ? 0 : undefined}
                    step={isNumeric ? 0.5 : undefined}
                    required
                    aria-invalid={hasError}
                    aria-describedby={hasError ? qErrorId : undefined}
                    value={screeningAnswers[idx] || ""}
                    onChange={(e) => handleScreeningChange(idx, e.target.value)}
                    placeholder={isNumeric ? "Enter a number" : "Your answer"}
                    className={`${INPUT_CLASS} ${isNumeric ? "sm:max-w-48" : ""} ${hasError ? "border-rose-300" : "border-border"}`}
                  />
                  {hasError && (
                    <p id={qErrorId} className="text-xs font-medium text-rose-600">
                      {screeningErrors[idx]}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </FormSection>
      )}

      <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground sm:max-w-sm">
          <ShieldCheck className="mt-px size-4 shrink-0 text-tech-green" aria-hidden="true" />
          <span>
            Your details go only to the N2P recruitment lead for this role. By applying you agree to our{" "}
            <Link href="/privacy-policy" className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
              Privacy Policy
            </Link>
            .
          </span>
        </p>
        <Button
          type="submit"
          variant="brand"
          size="lg"
          disabled={submitState === "submitting"}
          className="w-full shrink-0 sm:w-auto sm:min-w-48"
        >
          {submitState === "submitting" ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {submitPhase === "uploading" ? "Uploading resume…" : "Recording application…"}
            </>
          ) : (
            <>
              Submit application
              <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

/*
  text-base on mobile, 15px from sm+. Below 16px, iOS Safari auto-zooms the
  viewport on focus — on the highest-intent form on the site.
*/
export const INPUT_CLASS =
  "h-11 w-full rounded-xl border bg-background px-3.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 hover:border-primary/30 focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20 sm:text-[0.9375rem]"

export function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: number
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-5" aria-labelledby={`apply-step-${step}`}>
      <div className="flex items-start gap-3">
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold tabular-nums text-primary"
          aria-hidden="true"
        >
          {step}
        </span>
        <div>
          <h2 id={`apply-step-${step}`} className="text-subtitle text-foreground">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-caption text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

export function TextField({
  id,
  errorId,
  label,
  error,
  hint,
  required,
  ...inputProps
}: {
  id: string
  errorId: string
  label: string
  error?: string
  hint?: string
  required?: boolean
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const hintId = `${id}-hint`
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label} {required && <span className="text-rose-600" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={`${INPUT_CLASS} ${error ? "border-rose-300" : "border-border"}`}
        {...inputProps}
      />
      {error ? (
        <p id={errorId} className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/**
 * The browser's bare file input ("Choose File · No file chosen") was the one
 * control on the form that looked unstyled, and it had no drop target — most
 * desktop applicants drag the CV straight out of their downloads folder.
 * The real <input type="file"> stays in the DOM (visually hidden, still
 * focusable and labelled) so keyboard and screen-reader use is unchanged.
 */
export function ResumeDropzone({
  inputId,
  errorId,
  hintId,
  inputRef,
  file,
  error,
  onFile,
}: {
  inputId: string
  errorId: string
  hintId: string
  inputRef: React.RefObject<HTMLInputElement | null>
  file: File | null
  error?: string
  onFile: (file: File | null) => void
}) {
  const [dragging, setDragging] = useState(false)

  const clear = () => {
    if (inputRef.current) inputRef.current.value = ""
    onFile(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={Object.values(ACCEPTED).join(",")}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hintId}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        className="peer sr-only"
      />

      {file ? (
        <div
          className={`flex items-center gap-3 rounded-xl border bg-background p-3.5 sm:p-4 ${
            error ? "border-rose-300" : "border-tech-green/40"
          }`}
        >
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
              error ? "bg-rose-50 text-rose-600" : "bg-tech-green/10 text-tech-green"
            }`}
          >
            <FileText className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          <label
            htmlFor={inputId}
            className="shrink-0 cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            Replace
          </label>
          <button
            type="button"
            onClick={clear}
            aria-label={`Remove ${file.name}`}
            className="tap-target shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const dropped = e.dataTransfer.files?.[0]
            if (dropped) onFile(dropped)
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-5 py-8 text-center transition-colors peer-focus-visible:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20 ${
            dragging
              ? "border-primary bg-primary/[0.06]"
              : error
                ? "border-rose-300 bg-rose-50/40"
                : "border-border bg-background hover:border-primary/40 hover:bg-primary/[0.03]"
          }`}
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UploadCloud className="size-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold text-foreground">
            <span className="text-primary">Choose a file</span>
            <span className="hidden sm:inline"> or drag it here</span>
          </span>
          <span id={hintId} className="text-xs text-muted-foreground">
            PDF or DOCX · max 2 MB
          </span>
        </label>
      )}

      {error && (
        <p id={errorId} className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Shown when a listing came from the seed dataset and has no live requisition. */
export function ApplyUnavailable({ job }: { job: ApplyJob }) {
  return (
    <div className="py-6 text-center sm:py-10">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Paperclip className="size-6" aria-hidden="true" />
      </div>
      <h2 className="text-subtitle text-foreground">Direct apply is not available for this listing</h2>
      <p className="mx-auto mt-2 max-w-md text-body text-muted-foreground">
        This role is shown as a reference example rather than a live requisition. Submit your profile
        through our general talent form and our team will match you against current openings.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild variant="brand">
          <Link href={`/resume?role=${encodeURIComponent(job.title)}&category=${encodeURIComponent(job.domain)}`}>
            Submit general profile
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/jobs">
            <X className="size-4" aria-hidden="true" />
            Back to all roles
          </Link>
        </Button>
      </div>
    </div>
  )
}
