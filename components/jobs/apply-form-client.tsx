"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, FileText, HelpCircle, Loader2, Paperclip, ShieldCheck, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import type { Job } from "@/lib/jobs-data"

/** Mirrors the `applications` bucket limits so a rejection is explained here. */
const MAX_BYTES = 8 * 1024 * 1024

/** Budget for `job_applications.cover_note`. Screening answers get it first. */
const COVER_NOTE_MAX_CHARS = 4000
const ACCEPTED = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
} as const

type Field = "fullName" | "email" | "phone" | "location" | "currentCompany" | "experienceYears" | "linkedinUrl" | "coverNote"

const EMPTY: Record<Field, string> = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  currentCompany: "",
  experienceYears: "",
  linkedinUrl: "",
  coverNote: "",
}

/**
 * `<REFERENCE_CODE>/<uuid>.<ext>` inside the `applications` bucket — the exact
 * shape the storage policy in migration 00026 accepts. A random filename keeps
 * applicant PII out of object keys; the requisition folder keeps a recruiter's
 * inbox browsable.
 */
function storagePath(referenceCode: string, file: File): string {
  const safeRef = referenceCode.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 20)
  return `${safeRef}/${randomId()}.${extensionOf(file)}`
}

/**
 * `crypto.randomUUID` only exists in a secure context, and this call sits
 * inside the submit handler's `try` — so over plain HTTP (the LAN dev origin
 * in next.config.mjs, or any non-TLS deployment) every application died after
 * passing validation with "crypto.randomUUID is not a function" shown to the
 * candidate. The fallback only needs to be unique within a requisition folder.
 */
function randomId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  )
}

function extensionOf(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  return /^[a-z0-9]{1,8}$/.test(ext) ? ext : "pdf"
}

/**
 * The bucket enforces `allowed_mime_types` against the content type we send,
 * not the file's actual bytes — and browsers leave `File.type` empty often
 * enough (drag-and-drop, some Linux desktops, files with no registered handler)
 * that trusting it gets a legitimate CV rejected at the door. The portal hit
 * exactly this on its own `resumes` bucket; deriving from the extension is the
 * same fix, and the extension is what the allow-list is written against.
 */
const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

function resolveContentType(file: File): string {
  return MIME_BY_EXTENSION[extensionOf(file)] ?? (file.type || "application/pdf")
}

/**
 * Screening questions come from `job.screeningQuestions` as plain strings —
 * there's no stored "answer type" to render against, so this reads the
 * question text itself. Two shapes cover what recruiters actually write:
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

function classifyScreeningQuestion(question: string): QuestionKind {
  const q = question.trim().toLowerCase()
  if (/\d+\+?\s*years?\b/.test(q) || /\bhow many\b/.test(q)) return "numeric"
  if (/^(are|is|do|does|did|have|has|had|can|could|will|would|should|were|was)\b/.test(q)) return "boolean"
  return "text"
}

function validate(values: Record<Field, string>, file: File | null) {
  const errors: Partial<Record<Field | "resume", string>> = {}

  if (values.fullName.trim().length < 2) errors.fullName = "Please enter your full name."
  // Deliberately permissive — the database CHECK is the real gate, and an
  // over-strict pattern rejects valid addresses.
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Please enter a valid email address."
  if (values.coverNote.length > 4000) errors.coverNote = "Please keep this under 4000 characters."

  if (values.experienceYears.trim()) {
    const years = Number(values.experienceYears)
    if (!Number.isFinite(years) || years < 0 || years > 60) {
      errors.experienceYears = "Enter a number of years between 0 and 60."
    }
  }

  if (!file) {
    errors.resume = "Please attach your resume."
  } else if (file.size > MAX_BYTES) {
    errors.resume = "That file is over 8 MB. Please attach a smaller copy."
  } else if (!(extensionOf(file) in MIME_BY_EXTENSION)) {
    // Checked by extension, not File.type, for the reason given on
    // MIME_BY_EXTENSION — an empty File.type is common and not an error.
    errors.resume = "Please attach a PDF, DOC, or DOCX file."
  }

  return errors
}

export function ApplyFormClient({ job }: { job: Job }) {
  const formId = useId()
  const [values, setValues] = useState<Record<Field, string>>(EMPTY)
  const [screeningAnswers, setScreeningAnswers] = useState<Record<number, string>>({})
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Partial<Record<Field | "resume", string>>>({})
  const [screeningErrors, setScreeningErrors] = useState<Record<number, string>>({})
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "done">("idle")
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
    try {
      const path = storagePath(job.id, file!)

      const { error: uploadError } = await supabase.storage
        .from("applications")
        .upload(path, file!, { contentType: resolveContentType(file!), upsert: false })

      if (uploadError) throw new Error(`We could not upload your resume. ${uploadError.message}`)

      // Format screening questions & answers cleanly into cover_note
      const formattedScreeningNotes = (job.screeningQuestions || [])
        .map((q, idx) => {
          const a = (screeningAnswers[idx] || "").trim()
          return `Q: ${q}\nA: ${a}`
        })
        .join("\n\n")

      /*
        The screening answers are the dealbreaker record — work authorization,
        knockout skills, notice period — and recruiters triage on them. So the
        4000-character budget is spent on them first and the free-text note
        absorbs the cut, rather than one long note silently truncating the
        answers off the end. A note that is trimmed says so, because a cover
        letter that just stops mid-sentence reads as the applicant's doing.
      */
      const screeningBlock = formattedScreeningNotes
        ? `--- Pre-Screening Questions ---\n${formattedScreeningNotes}`
        : ""
      const noteBody = values.coverNote.trim()

      const noteParts: string[] = []
      if (screeningBlock) noteParts.push(screeningBlock)
      if (noteBody) {
        const header = "--- Candidate Note ---\n"
        const separator = screeningBlock ? "\n\n" : ""
        const budget =
          COVER_NOTE_MAX_CHARS - screeningBlock.length - separator.length - header.length
        if (budget > 0) {
          const marker = "\n[note truncated]"
          const fits = noteBody.length <= budget
          noteParts.push(
            header +
              (fits ? noteBody : noteBody.slice(0, Math.max(0, budget - marker.length)) + marker)
          )
        }
      }
      // Still bounded: a screening block alone can in principle exceed the
      // column budget, and losing the tail of it beats losing the whole row.
      const combinedCoverNote =
        noteParts.length > 0 ? noteParts.join("\n\n").slice(0, COVER_NOTE_MAX_CHARS) : null

      // Do not add `.select()` here. `anon` holds an INSERT grant on these
      // columns and no SELECT grant at all (migration 00025), so asking for the
      // inserted row back turns a working submission into "permission denied
      // for table job_applications" and the applicant loses their upload.
      const { error: insertError } = await supabase.from("job_applications").insert({
        requirement_id: job.requirementUuid,
        full_name: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim() || null,
        location: values.location.trim() || null,
        current_company: values.currentCompany.trim() || null,
        experience_years: values.experienceYears.trim() ? Number(values.experienceYears) : null,
        linkedin_url: values.linkedinUrl.trim() || null,
        cover_note: combinedCoverNote,
        resume_path: path,
        resume_filename: file!.name.slice(0, 260),
      })

      if (insertError) {
        /*
          The object uploaded above is now orphaned: the CV has to be in the
          bucket before the row can carry its path, so a failed insert leaves a
          file nothing references — most often on the ordinary "already
          applied" retry.

          It is deliberately not cleaned up here. `anon` holds INSERT and only
          INSERT on storage.objects for this bucket (migration 00026), so a
          client-side remove is refused every time — dead code that reads like
          a safeguard. Granting anon DELETE is the wrong trade: these uploads
          have no owner, so the narrowest policy expressible would let any
          visitor delete any applicant's CV. Reaping belongs server-side, to a
          scheduled sweep of objects with no matching `job_applications.resume_path`.
        */
        // 23505 is the (requirement_id, lower(email)) unique index.
        if (insertError.code === "23505") {
          throw new Error("You have already applied to this role. Our team has your profile.")
        }
        throw new Error(`We could not record your application. ${insertError.message}`)
      }

      setSubmitState("done")
      const thankYouUrl = `/jobs/thank-you?ref=${encodeURIComponent(job.id)}&role=${encodeURIComponent(job.title)}&name=${encodeURIComponent(values.fullName.trim())}`
      window.location.href = thankYouUrl
    } catch (err) {
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
        className="surface p-8 text-center outline-none"
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

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
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
              {submitError ? "We could not submit your application" : "Please check the highlighted fields"}
            </p>
            {submitError && <p className="mt-1 leading-relaxed">{submitError}</p>}
            {!submitError && invalidScreeningCount > 0 && invalidFields.length === 0 && (
              <p className="mt-1 leading-relaxed">Please answer all required pre-screening questions below.</p>
            )}
          </div>
        </div>
      )}

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
        />
        <TextField
          id={fieldId("phone")}
          errorId={errorId("phone")}
          label="Phone"
          type="tel"
          inputMode="tel"
          value={values.phone}
          onChange={set("phone")}
          error={errors.phone}
          autoComplete="tel"
        />
        <TextField
          id={fieldId("location")}
          errorId={errorId("location")}
          label="Current location"
          value={values.location}
          onChange={set("location")}
          error={errors.location}
          placeholder="City, Country"
          autoComplete="address-level2"
        />
        <TextField
          id={fieldId("currentCompany")}
          errorId={errorId("currentCompany")}
          label="Current company"
          value={values.currentCompany}
          onChange={set("currentCompany")}
          error={errors.currentCompany}
          autoComplete="organization"
        />
        <TextField
          id={fieldId("experienceYears")}
          errorId={errorId("experienceYears")}
          label="Years of experience"
          type="number"
          inputMode="decimal"
          value={values.experienceYears}
          onChange={set("experienceYears")}
          error={errors.experienceYears}
          placeholder="e.g. 6"
        />
      </div>

      <TextField
        id={fieldId("linkedinUrl")}
        errorId={errorId("linkedinUrl")}
        label="LinkedIn profile"
        type="url"
        inputMode="url"
        autoComplete="url"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={values.linkedinUrl}
        onChange={set("linkedinUrl")}
        error={errors.linkedinUrl}
        placeholder="https://linkedin.com/in/..."
      />

      {/* Resume upload */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId("resume")} className="text-sm font-semibold text-foreground">
          Resume <span className="text-rose-600">*</span>
        </label>
        <input
          ref={fileInputRef}
          id={fieldId("resume")}
          type="file"
          accept={Object.values(ACCEPTED).join(",")}
          required
          aria-invalid={Boolean(errors.resume)}
          aria-describedby={errors.resume ? errorId("resume") : `${formId}-resume-hint`}
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null)
            setErrors((prev) => ({ ...prev, resume: undefined }))
          }}
          className={`block w-full cursor-pointer rounded-xl border bg-background text-base text-foreground outline-none transition-colors file:mr-4 file:cursor-pointer file:border-0 file:bg-secondary file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-secondary-foreground hover:file:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-[0.9375rem] ${
            errors.resume ? "border-rose-300" : "border-border"
          }`}
        />
        {file && !errors.resume && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="size-3.5 text-muted-foreground/70" aria-hidden="true" />
            {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>
        )}
        {errors.resume ? (
          <p id={errorId("resume")} className="text-xs font-medium text-rose-600">
            {errors.resume}
          </p>
        ) : (
          <p id={`${formId}-resume-hint`} className="text-xs text-muted-foreground">
            PDF, DOC, or DOCX. Maximum 8 MB.
          </p>
        )}
      </div>

      {/* Role Pre-Screening Questions */}
      {job.screeningQuestions && job.screeningQuestions.length > 0 && (
        <div className="flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/[0.02] p-5 sm:p-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <HelpCircle className="size-4 text-primary" aria-hidden="true" />
              Role Pre-Screening Questions
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Please answer these qualifying questions from the hiring team for this requisition.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {job.screeningQuestions.map((question, idx) => {
              const qFieldId = fieldId(`screening_${idx}`)
              const qErrorId = errorId(`screening_${idx}`)
              const hasError = Boolean(screeningErrors[idx])
              const kind = classifyScreeningQuestion(question)

              // Yes/No questions ("Are you authorized to...") get a real
              // two-option control instead of a free-text field, so the
              // stored answer is always exactly "Yes" or "No" — not "yes",
              // "Yep", or a sentence a recruiter then has to interpret.
              if (kind === "boolean") {
                return (
                  <fieldset key={idx} className="flex flex-col gap-2">
                    <legend className="text-sm font-medium text-foreground leading-snug">
                      <span className="font-mono text-xs text-primary font-semibold mr-1.5">Q{idx + 1}.</span>
                      {question} <span className="text-rose-600">*</span>
                    </legend>
                    <div
                      role="radiogroup"
                      aria-invalid={hasError}
                      aria-describedby={hasError ? qErrorId : undefined}
                      className="flex gap-2.5"
                    >
                      {(["Yes", "No"] as const).map((option) => {
                        const optionId = `${qFieldId}-${option.toLowerCase()}`
                        const checked = screeningAnswers[idx] === option
                        return (
                          <label
                            key={option}
                            htmlFor={optionId}
                            className={`flex h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold outline-none transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/30 sm:flex-none sm:px-10 ${
                              checked
                                ? "border-primary bg-primary/10 text-primary"
                                : hasError
                                  ? "border-rose-300 text-muted-foreground"
                                  : "border-border text-muted-foreground hover:border-primary/40"
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

              // "5+ years", "How many years..." — what a recruiter actually
              // screens on is the number, so this gets a numeric input
              // rather than forcing a yes/no on a threshold question.
              const isNumeric = kind === "numeric"

              return (
                <div key={idx} className="flex flex-col gap-1.5">
                  <label htmlFor={qFieldId} className="text-sm font-medium text-foreground leading-snug">
                    <span className="font-mono text-xs text-primary font-semibold mr-1.5">Q{idx + 1}.</span>
                    {question} <span className="text-rose-600">*</span>
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
                    placeholder={isNumeric ? "Enter number of years…" : "Enter your answer…"}
                    className={`h-11 w-full rounded-xl border bg-background px-3.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-[0.9375rem] ${
                      hasError ? "border-rose-300" : "border-border"
                    }`}
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
        </div>
      )}

      {/* Cover note */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId("coverNote")} className="text-sm font-semibold text-foreground">
          Anything you would like the hiring team to know?
        </label>
        <textarea
          id={fieldId("coverNote")}
          rows={5}
          maxLength={4000}
          value={values.coverNote}
          onChange={set("coverNote")}
          aria-invalid={Boolean(errors.coverNote)}
          aria-describedby={errors.coverNote ? errorId("coverNote") : undefined}
          /*
            text-base on mobile, text-body from sm+ — the previous text-sm
            (14px) at every breakpoint triggered iOS Safari's automatic
            viewport zoom on focus for every one of this form's fields.
          */
          className={`w-full rounded-xl border bg-background px-3.5 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-[0.9375rem] ${
            errors.coverNote ? "border-rose-300" : "border-border"
          }`}
          placeholder="Optional — a short note on why this role fits."
        />
        {errors.coverNote && (
          <p id={errorId("coverNote")} className="text-xs font-medium text-rose-600">
            {errors.coverNote}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />
          Your details go directly to the N2P recruitment lead for this requisition.
        </p>
        <Button
          type="submit"
          variant="brand"
          size="lg"
          disabled={submitState === "submitting"}
          className="shrink-0"
        >
          {submitState === "submitting" ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Submitting…
            </>
          ) : (
            "Submit application"
          )}
        </Button>
      </div>
    </form>
  )
}

function TextField({
  id,
  errorId,
  label,
  error,
  required,
  ...inputProps
}: {
  id: string
  errorId: string
  label: string
  error?: string
  required?: boolean
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label} {required && <span className="text-rose-600">*</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        /*
          text-base on mobile, text-body (15px) from sm+. This form's inputs
          used to be text-sm (14px) at every breakpoint — below the 16px
          threshold that keeps iOS Safari from auto-zooming the viewport on
          focus, on the highest-intent form on the site.
        */
        className={`h-11 w-full rounded-xl border bg-background px-3.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-[0.9375rem] ${
          error ? "border-rose-300" : "border-border"
        }`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}

/** Shown when a listing came from the seed dataset and has no live requisition. */
export function ApplyUnavailable({ job }: { job: Job }) {
  return (
    <div className="surface p-8 text-center">
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
