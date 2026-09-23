"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"

/**
 * The per-field message, styled to match native form errors
 * so a browser-generated string ("Please fill out this field.") and our own
 * copy read as one system.
 */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-xs font-medium text-red-600">
      {message}
    </p>
  )
}

export function ConsultationFormClient() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  const errorId = (name: string) => `${name}-error`

  /* Clear a field's error the moment it becomes valid, rather than leaving a
     stale message sitting under a corrected field until the next submit. */
  const handleInput = (e: React.FormEvent<HTMLFormElement>) => {
    const el = e.target
    const isFormField =
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement
    if (!isFormField || !el.name || !el.validity.valid) return
    setFieldErrors((prev) => {
      if (!prev[el.name]) return prev
      const next = { ...prev }
      delete next[el.name]
      return next
    })
  }

  /**
   * Back to a blank form after a successful submit.
   */
  const resetForm = () => {
    setFieldErrors({})
    setStatus("idle")
  }

  /** Wires a control to its error message for assistive tech. */
  const invalidProps = (name: string) =>
    fieldErrors[name]
      ? ({ "aria-invalid": true, "aria-describedby": errorId(name) } as const)
      : {}

  // Move focus to the confirmation so screen reader users are told the
  // request actually went through, instead of being left on a removed button.
  useEffect(() => {
    if (status === "success") successRef.current?.focus()
  }, [status])

  if (status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center py-16 text-center outline-none"
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-tech-green/10">
          <CheckCircle2 className="h-8 w-8 text-tech-green" aria-hidden="true" />
        </div>
        <h3 className="text-title text-foreground">Quote Request Received</h3>
        <p className="mt-3 max-w-md text-body text-muted-foreground">
          Thank you for your interest. A member of our team will review your
          requirements and respond within one business day with a tailored proposal.
        </p>
        <Button type="button" variant="outline" className="mt-8" onClick={resetForm}>
          Submit another request
        </Button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formRef.current) return

    const errors: Record<string, string> = {}
    let firstInvalid: HTMLElement | null = null
    for (const el of Array.from(formRef.current.elements)) {
      const isFormField =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      if (!isFormField || !el.name || el.validity.valid) continue
      errors[el.name] = el.validationMessage
      if (!firstInvalid) firstInvalid = el
    }
    setFieldErrors(errors)

    if (firstInvalid) {
      firstInvalid.focus()
      return
    }

    const data = new FormData(formRef.current)

    setStatus("loading")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        body: data,
      })
      setStatus(res.ok ? "success" : "error")
    } catch {
      setStatus("error")
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onInput={handleInput}
      noValidate
      // ↓ Mobile: tighter vertical rhythm. sm+ unchanged.
      className="space-y-4 sm:space-y-6"
    >
      {/* Honeypot field — hidden from real users, filled by automated spam bots */}
      <div
        className="absolute -left-[9999px] -top-[9999px] h-0 w-0 overflow-hidden opacity-0 pointer-events-none"
        aria-hidden="true"
        tabIndex={-1}
      >
        <label htmlFor="website_hp">Website</label>
        <input
          id="website_hp"
          type="text"
          name="website_hp"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Live region so submission failures are announced, not just shown. */}
      <div role="alert" aria-live="assertive">
        {status === "error" && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Something went wrong. Email us at{" "}
              <a href="mailto:info@n2psystems.ca" className="font-semibold underline">
                info@n2psystems.ca
              </a>
            </span>
          </div>
        )}
      </div>

      {/* ↓ Mobile: 2-col with tighter gap (short labels fit fine side-by-side). sm+ unchanged. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-sm font-medium text-foreground">
            First Name *
          </label>
          <Input
            id="firstName"
            name="firstName"
            required
            autoComplete="given-name"
            placeholder="Jane"
            {...invalidProps("firstName")}
          />
          <FieldError id={errorId("firstName")} message={fieldErrors.firstName} />
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-medium text-foreground">
            Last Name *
          </label>
          <Input
            id="lastName"
            name="lastName"
            required
            autoComplete="family-name"
            placeholder="Smith"
            {...invalidProps("lastName")}
          />
          <FieldError id={errorId("lastName")} message={fieldErrors.lastName} />
        </div>
      </div>

      {/* ↓ Mobile: keep 1-col (long labels), just tighten the gap. sm+ unchanged. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div className="space-y-2">
          <label htmlFor="companyName" className="text-sm font-medium text-foreground">
            Company / Organization *
          </label>
          <Input
            id="companyName"
            name="companyName"
            required
            autoComplete="organization"
            placeholder="Acme Corporation"
            {...invalidProps("companyName")}
          />
          <FieldError id={errorId("companyName")} message={fieldErrors.companyName} />
        </div>
        <div className="space-y-2">
          <label htmlFor="jobTitle" className="text-sm font-medium text-foreground">
            Your Role / Title
          </label>
          <Input
            id="jobTitle"
            name="jobTitle"
            autoComplete="organization-title"
            placeholder="CTO, Founder, IT Director..."
          />
        </div>
      </div>

      {/* Email & Phone: 1-col on mobile for roomy input without truncation, 2-col on sm+ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Work Email *
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="jane@acme.com"
            {...invalidProps("email")}
          />
          <FieldError id={errorId("email")} message={fieldErrors.email} />
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-foreground">
            Phone Number
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="details" className="text-sm font-medium text-foreground">
          Project Details
        </label>
        {/* ↓ Mobile: 1 fewer row saves ~20px of height */}
        <Textarea
          id="details"
          name="details"
          rows={4}
          autoComplete="off"
          placeholder="Describe your goals, challenges, or the scope of work you need help with. The more detail you provide, the more accurate our quote will be."
        />
      </div>

      <Button type="submit" variant="brand" size="lg" disabled={status === "loading"} className="w-full">
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Submitting...
          </>
        ) : (
          "Submit Quote Request"
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Your information is kept confidential and will only be used to prepare
        your personalized quote.
      </p>
    </form>
  )
}
