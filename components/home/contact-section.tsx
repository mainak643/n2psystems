"use client"

import { useState, useRef, useEffect, useId } from "react"
import { Clock, Globe, Mail, Phone, CheckCircle2, Loader2, AlertCircle } from "lucide-react"

const contactDetails = [
  { icon: Phone, label: "Canada & USA", value: "+1 (437) 335-9390", href: "tel:+14373359390" },
  { icon: Phone, label: "India", value: "+91 97760 47567", href: "tel:+919776047567" },
  { icon: Mail, label: "Email", value: "info@n2psystems.ca", href: "mailto:info@n2psystems.ca" },
  { icon: Globe, label: "Operates In", value: "India, Canada, USA", href: null },
  { icon: Clock, label: "Hours", value: "Mon - Fri, 9:00 AM – 6:00 PM EST", href: null },
]

/*
  min-h-11 keeps every field at a comfortable touch size, and the 16px
  font size on mobile is deliberate: iOS Safari zooms the viewport when
  a focused input renders below 16px.
*/
const inputClass =
  "w-full min-h-11 rounded-xl border border-border bg-background px-4 py-2.5 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-[border-color,box-shadow] duration-200 hover:border-muted-foreground/30 focus:border-signature-blue focus:ring-4 focus:ring-signature-blue/10"

const labelClass =
  "block text-overline uppercase text-muted-foreground"

function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  /* Move focus to the confirmation so screen reader users are told the
     message actually sent, instead of being left on a removed button. */
  useEffect(() => {
    if (status === "success") successRef.current?.focus()
  }, [status])

  if (status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="flex flex-col items-center justify-center py-10 text-center outline-none"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 mb-4">
          <CheckCircle2 className="h-7 w-7 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Message Sent</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
          Thank you for reaching out. We'll get back to you within one business day.
        </p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formRef.current) return
    setStatus("loading")
    try {
      const res = await fetch("https://formspree.io/f/xqazpory", {
        method: "POST",
        body: new FormData(formRef.current),
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
      className="space-y-4"
    >
      {/* Live region so submission failures are announced, not just shown. */}
      <div role="alert" aria-live="assertive">
        {status === "error" && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Failed to send. Email us at <a href="mailto:info@n2psystems.ca" className="font-semibold underline">info@n2psystems.ca</a></span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className={labelClass}>
            Full Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            autoCapitalize="words"
            placeholder="Jane Smith"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className={labelClass}>
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="jane@company.com"
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="phone" className={labelClass}>
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+1 (555) 000-0000"
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="subject" className={labelClass}>
          Subject *
        </label>
        <input id="subject" name="subject" type="text" required placeholder="How can we help?" className={inputClass} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className={labelClass}>
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          placeholder="Tell us more about your inquiry..."
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1E63B5] to-[#164e93] px-6 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(30,99,181,0.55)] transition-all duration-200 hover:shadow-[0_10px_28px_-6px_rgba(30,99,181,0.7)] hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-[0_6px_20px_-6px_rgba(30,99,181,0.55)] disabled:hover:brightness-100"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          "Send Message"
        )}
      </button>
    </form>
  )
}

// ─── Contact Details Card ─────────────────────────────────────────────────────
function ContactInfoPanel() {
  return (
    <div className="surface h-full p-6 sm:p-8">
      <h3 className="text-title text-foreground">Need assistance?</h3>
      <p className="mt-2 text-body text-muted-foreground">
        Reach out directly to the N2P team.
      </p>

      <div className="mt-6 space-y-2.5">
        {contactDetails.map((item) => {
          const content = (
            <>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-signature-blue/[0.08] text-signature-blue transition-colors duration-200 group-hover:bg-signature-blue/[0.14]">
                <item.icon className="size-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-overline uppercase text-muted-foreground/70">
                  {item.label}
                </p>
                <p className="mt-1 truncate text-body leading-snug text-foreground">
                  {item.value}
                </p>
              </div>
            </>
          )

          /* Phone numbers and email are actionable — on mobile these are
             the fastest path to a conversation, so they are real links. */
          return item.href ? (
            <a
              key={item.label}
              href={item.href}
              className="group flex min-h-11 items-center gap-4 rounded-xl border border-border bg-background px-4 py-3 transition-colors duration-200 hover:border-signature-blue/25 hover:bg-signature-blue/[0.03]"
            >
              {content}
            </a>
          ) : (
            <div
              key={item.label}
              className="group flex min-h-11 items-center gap-4 rounded-xl border border-border bg-background px-4 py-3"
            >
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Form Card ────────────────────────────────────────────────────────────────
function ContactFormPanel() {
  return (
    <div className="surface h-full p-6 sm:p-8">
      <h3 className="text-title text-foreground">Send a message</h3>
      <p className="mt-2 text-body text-muted-foreground">
        We'll get back to you within one business day.
      </p>
      <div className="mt-6">
        <ContactForm />
      </div>
    </div>
  )
}

// ─── Main Section ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "info" as const, label: "Contact Info" },
  { id: "message" as const, label: "Send Message" },
]

export function ContactSection() {
  const [activeTab, setActiveTab] = useState<"info" | "message">("info")
  const uid = useId()

  const tabId = (id: string) => `${uid}-tab-${id}`
  const panelId = (id: string) => `${uid}-panel-${id}`

  /* Roving arrow-key navigation between the two tabs. */
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
    e.preventDefault()
    const next = activeTab === "info" ? "message" : "info"
    setActiveTab(next)
    document.getElementById(tabId(next))?.focus()
  }

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="section-y relative overflow-hidden border-t border-border bg-background"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow eyebrow-center mb-4">Contact</p>
          <h2
            id="contact-heading"
            className="text-heading text-balance text-foreground"
          >
            Connect with our team
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lead text-muted-foreground">
            Share the details of your hiring, transformation, or talent strategy
            and our team will respond fast.
          </p>
        </div>

        {/*
          ── TAB SWITCHER — mobile/tablet only (<lg) ──────────────────────────
          Segmented control between "Contact Info" and "Send Message".
          Removed from the accessibility tree on lg+, where both panels
          are shown side by side and there is nothing to switch between.
        */}
        <div className="mt-8 sm:mt-10 lg:hidden">
          <div
            role="tablist"
            aria-label="Contact options"
            className="flex gap-1 rounded-xl border border-border bg-card p-1"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  id={tabId(tab.id)}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={panelId(tab.id)}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={handleTabKeyDown}
                  className={`
                    min-h-11 flex-1 rounded-lg py-2.5 text-sm font-semibold
                    transition-all duration-200
                    ${isActive
                      ? "bg-signature-blue text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/*
          ── PANELS ───────────────────────────────────────────────────────────
          Each panel is rendered exactly once and shown/hidden with CSS.

          Previously the mobile stack and the desktop grid each rendered
          their own <ContactFormPanel />, so two copies of the form — and
          therefore two elements with id="name", id="email", etc. — were in
          the DOM at the same time. Labels resolve to the first matching id,
          which meant tapping a label on mobile could focus the
          display:none desktop input instead.

          Toggling with `hidden` rather than unmounting also means a
          half-filled message survives a trip to the Contact Info tab.
        */}
        <div className="mt-3 grid gap-8 lg:mt-12 lg:grid-cols-2 lg:items-start">
          <div
            id={panelId("info")}
            role="tabpanel"
            aria-labelledby={tabId("info")}
            className={activeTab === "info" ? "" : "hidden lg:block"}
          >
            <ContactInfoPanel />
          </div>

          <div
            id={panelId("message")}
            role="tabpanel"
            aria-labelledby={tabId("message")}
            className={activeTab === "message" ? "" : "hidden lg:block"}
          >
            <ContactFormPanel />
          </div>
        </div>

      </div>
    </section>
  )
}