"use client"

import { useId, useRef, useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, FileText, Loader2, Paperclip, ShieldCheck, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import type { Job } from "@/lib/jobs-data"

/** Mirrors the `applications` bucket limits so a rejection is explained here. */
const MAX_BYTES = 8 * 1024 * 1024
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
  return `${safeRef}/${crypto.randomUUID()}.${extensionOf(file)}`
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
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Partial<Record<Field | "resume", string>>>({})
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "done">("idle")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const errorSummaryRef = useRef<HTMLDivElement | null>(null)

  const set = (field: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const fieldId = (field: string) => `${formId}-${field}`
  const errorId = (field: string) => `${formId}-${field}-error`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const found = validate(values, file)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      // Move the user to the problem rather than leaving them at a dead button.
      errorSummaryRef.current?.focus()
      return
    }

    setSubmitState("submitting")
    try {
      const path = storagePath(job.id, file!)

      const { error: uploadError } = await supabase.storage
        .from("applications")
        .upload(path, file!, { contentType: resolveContentType(file!), upsert: false })

      if (uploadError) throw new Error(`We could not upload your resume. ${uploadError.message}`)

      const { error: insertError } = await supabase.from("job_applications").insert({
        requirement_id: job.requirementUuid,
        full_name: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim() || null,
        location: values.location.trim() || null,
        current_company: values.currentCompany.trim() || null,
        experience_years: values.experienceYears.trim() ? Number(values.experienceYears) : null,
        linkedin_url: values.linkedinUrl.trim() || null,
        cover_note: values.coverNote.trim() || null,
        resume_path: path,
        resume_filename: file!.name.slice(0, 260),
      })

      if (insertError) {
        // 23505 is the (requirement_id, lower(email)) unique index.
        if (insertError.code === "23505") {
          throw new Error("You have already applied to this role. Our team has your profile.")
        }
        throw new Error(`We could not record your application. ${insertError.message}`)
      }

      setSubmitState("done")
    } catch (err) {
      setSubmitState("idle")
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    }
  }

  if (submitState === "done") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-tech-green/25 bg-white p-8 text-center shadow-sm"
      >
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-tech-green/10 text-tech-green">
          <CheckCircle2 className="size-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-950">Application received</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
          Thank you, {values.fullName.trim().split(" ")[0]}. Your profile for{" "}
          <span className="font-semibold text-slate-900">{job.title}</span> is with our recruitment
          lead for this requisition. If it is a fit, we will be in touch by email.
        </p>
        <p className="mt-3 font-mono text-xs text-slate-500">Requisition Ref: {job.id}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/jobs">
            <Button variant="outline" className="rounded-xl border-slate-200">
              Browse other roles
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const invalidFields = Object.entries(errors).filter(([, message]) => Boolean(message))

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {(invalidFields.length > 0 || submitError) && (
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 outline-none"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-600" />
          <div className="text-sm text-rose-800">
            <p className="font-semibold">
              {submitError ? "We could not submit your application" : "Please check the highlighted fields"}
            </p>
            {submitError && <p className="mt-1 leading-relaxed">{submitError}</p>}
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
          value={values.email}
          onChange={set("email")}
          error={errors.email}
          autoComplete="email"
        />
        <TextField
          id={fieldId("phone")}
          errorId={errorId("phone")}
          label="Phone"
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
        value={values.linkedinUrl}
        onChange={set("linkedinUrl")}
        error={errors.linkedinUrl}
        placeholder="https://linkedin.com/in/..."
      />

      {/* Resume upload */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId("resume")} className="text-sm font-semibold text-slate-800">
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
          className={`block w-full cursor-pointer rounded-xl border bg-white text-sm text-slate-700 outline-none transition-colors file:mr-4 file:cursor-pointer file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200 focus-visible:ring-2 focus-visible:ring-signature-blue/30 ${
            errors.resume ? "border-rose-300" : "border-slate-200"
          }`}
        />
        {file && !errors.resume && (
          <p className="flex items-center gap-1.5 text-xs text-slate-600">
            <FileText className="size-3.5 text-slate-400" />
            {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>
        )}
        {errors.resume ? (
          <p id={errorId("resume")} className="text-xs font-medium text-rose-600">
            {errors.resume}
          </p>
        ) : (
          <p id={`${formId}-resume-hint`} className="text-xs text-slate-500">
            PDF, DOC, or DOCX. Maximum 8 MB.
          </p>
        )}
      </div>

      {/* Cover note */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId("coverNote")} className="text-sm font-semibold text-slate-800">
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
          className={`w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-signature-blue focus:ring-2 focus:ring-signature-blue/20 ${
            errors.coverNote ? "border-rose-300" : "border-slate-200"
          }`}
          placeholder="Optional — a short note on why this role fits."
        />
        {errors.coverNote && (
          <p id={errorId("coverNote")} className="text-xs font-medium text-rose-600">
            {errors.coverNote}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="size-4 shrink-0 text-slate-400" />
          Your details go directly to the N2P recruitment lead for this requisition.
        </p>
        <Button
          type="submit"
          disabled={submitState === "submitting"}
          className="h-11 shrink-0 rounded-xl bg-[#1E63B5] px-8 font-semibold text-white hover:bg-[#164e93] disabled:opacity-70"
        >
          {submitState === "submitting" ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
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
      <label htmlFor={id} className="text-sm font-semibold text-slate-800">
        {label} {required && <span className="text-rose-600">*</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-signature-blue focus:ring-2 focus:ring-signature-blue/20 ${
          error ? "border-rose-300" : "border-slate-200"
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
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Paperclip className="size-6" />
      </div>
      <h2 className="text-lg font-bold text-slate-950">Direct apply is not available for this listing</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        This role is shown as a reference example rather than a live requisition. Submit your profile
        through our general talent form and our team will match you against current openings.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={`/resume?role=${encodeURIComponent(job.title)}&category=${encodeURIComponent(job.domain)}`}>
          <Button className="rounded-xl bg-[#1E63B5] text-white hover:bg-[#164e93]">
            Submit general profile
          </Button>
        </Link>
        <Link href="/jobs">
          <Button variant="outline" className="rounded-xl border-slate-200">
            <X className="mr-1.5 size-4" />
            Back to all roles
          </Button>
        </Link>
      </div>
    </div>
  )
}
