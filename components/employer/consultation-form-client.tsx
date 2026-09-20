"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"

export function ConsultationFormClient() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [serviceInterest, setServiceInterest] = useState("")
  const [budget, setBudget] = useState("")
  const [timeline, setTimeline] = useState("")
  /*
    Tracks whether the required-Select check has run at least once, so the
    empty-field error only appears after a real submit attempt rather than
    on first render.
  */
  const [serviceInterestTouched, setServiceInterestTouched] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLDivElement>(null)
  const serviceTriggerRef = useRef<HTMLButtonElement>(null)

  const serviceInterestInvalid = serviceInterestTouched && serviceInterest === ""
  const serviceInterestErrorId = "serviceInterest-error"

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
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formRef.current) return

    /*
      The Select's Radix Root used to carry `required`, which renders a
      visually-hidden native <select> mirror inside the <form> and lets the
      browser's own constraint validation block the submit — showing a
      validation bubble anchored to a 1x1px clipped element that nobody
      could see. The button looked dead. Validating explicitly here, with a
      visible + announced error, replaces that invisible block.
    */
    if (serviceInterest === "") {
      setServiceInterestTouched(true)
      serviceTriggerRef.current?.focus()
      return
    }

    const data = new FormData(formRef.current)
    data.set("serviceInterest", serviceInterest)
    data.set("budget", budget)
    data.set("timeline", timeline)

    setStatus("loading")
    try {
      const res = await fetch("https://formspree.io/f/xqazpory", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
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
      noValidate
      // ↓ Mobile: tighter vertical rhythm. sm+ unchanged.
      className="space-y-4 sm:space-y-6"
    >
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
          />
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
          />
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
          />
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
          />
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
        <label htmlFor="serviceInterest" className="text-sm font-medium text-foreground">
          Service You're Interested In *
        </label>
        <Select
          value={serviceInterest}
          onValueChange={(value) => {
            setServiceInterest(value)
            setServiceInterestTouched(true)
          }}
        >
          <SelectTrigger
            id="serviceInterest"
            ref={serviceTriggerRef}
            aria-invalid={serviceInterestInvalid}
            aria-describedby={serviceInterestInvalid ? serviceInterestErrorId : undefined}
            className="w-full"
          >
            <SelectValue placeholder="Select a service area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="consulting">Consulting & Strategy Advisory</SelectItem>
            <SelectItem value="digital-transformation">Digital Transformation</SelectItem>
            <SelectItem value="ai-integration">AI Integration & Automation</SelectItem>
            <SelectItem value="program-management">Program Management & Delivery</SelectItem>
            <SelectItem value="hosting">Hosting & Cloud Infrastructure</SelectItem>
            <SelectItem value="learning">Learning & Enablement</SelectItem>
            <SelectItem value="partnerships">Strategic Partnerships</SelectItem>
            <SelectItem value="multiple">Multiple Services / Not Sure Yet</SelectItem>
          </SelectContent>
        </Select>
        {serviceInterestInvalid && (
          <p id={serviceInterestErrorId} role="alert" className="text-xs font-medium text-red-600">
            Please select a service area.
          </p>
        )}
      </div>

      {/* Budget & Timeline: 1-col on mobile so select labels never truncate, 2-col on sm+ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div className="space-y-2">
          <label htmlFor="budget" className="text-sm font-medium text-foreground">
            Estimated Budget
          </label>
          <Select value={budget} onValueChange={setBudget}>
            <SelectTrigger id="budget" className="w-full">
              <SelectValue placeholder="Select a range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="under-10k">Under $10,000</SelectItem>
              <SelectItem value="10k-25k">$10,000 – $25,000</SelectItem>
              <SelectItem value="25k-50k">$25,000 – $50,000</SelectItem>
              <SelectItem value="50k-100k">$50,000 – $100,000</SelectItem>
              <SelectItem value="100k-plus">$100,000+</SelectItem>
              <SelectItem value="tbd">To Be Discussed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label htmlFor="timeline" className="text-sm font-medium text-foreground">
            Expected Timeline
          </label>
          <Select value={timeline} onValueChange={setTimeline}>
            <SelectTrigger id="timeline" className="w-full">
              <SelectValue placeholder="Select a timeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asap">As Soon As Possible</SelectItem>
              <SelectItem value="1-month">Within 1 Month</SelectItem>
              <SelectItem value="1-3-months">1 – 3 Months</SelectItem>
              <SelectItem value="3-6-months">3 – 6 Months</SelectItem>
              <SelectItem value="flexible">Flexible / Ongoing</SelectItem>
            </SelectContent>
          </Select>
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
