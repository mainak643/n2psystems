"use client"

import { useState } from "react"
import { Clock, Globe, Mail, Phone, CheckCircle2 } from "lucide-react"

const contactDetails = [
  { icon: Phone, label: "Canada & USA", value: "+1 (437) 335-9390" },
  { icon: Phone, label: "India", value: "+91 97760 47567" },
  { icon: Mail, label: "Email", value: "info@n2psystems.com" },
  { icon: Globe, label: "Operates In", value: "India, Canada, USA" },
  { icon: Clock, label: "Hours", value: "Mon - Fri, 9:00 AM – 6:00 PM EST" },
]

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-signature-blue focus:ring-2 focus:ring-signature-blue/15"

function ContactForm() {
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
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

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setSubmitted(true) }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Full Name *
          </label>
          <input id="name" type="text" required placeholder="Jane Smith" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Email *
          </label>
          <input id="email" type="email" required placeholder="jane@company.com" className={inputClass} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Phone Number
        </label>
        <input id="phone" type="tel" placeholder="+1 (555) 000-0000" className={inputClass} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="subject" className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Subject *
        </label>
        <input id="subject" type="text" required placeholder="How can we help?" className={inputClass} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Message *
        </label>
        <textarea
          id="message"
          required
          rows={4}
          placeholder="Tell us more about your inquiry..."
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-signature-blue px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-signature-blue/90 focus:outline-none focus:ring-2 focus:ring-signature-blue/40"
      >
        Send Message
      </button>
    </form>
  )
}

export function ContactSection() {
  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-background border-t border-border pt-10 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-24"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-signature-blue">
            Contact
          </p>
          <h2 className="text-balance font-sans text-2xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Connect with our team
          </h2>
          <p className="mx-auto mt-4 sm:mt-5 max-w-2xl text-[15px] sm:text-lg leading-relaxed text-muted-foreground">
            Share the details of your hiring, transformation, or talent strategy
            and our team will respond fast.
          </p>
        </div>

        {/* Grid — items-start so cards don't stretch to each other's height */}
        <div className="mt-8 sm:mt-12 grid gap-5 sm:gap-6 lg:gap-8 lg:grid-cols-2 lg:items-start">

          {/* Left — Contact Details */}
          <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">Need assistance?</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Reach out directly to the N2P team.
            </p>

            <div className="mt-5 space-y-3">
              {contactDetails.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3.5 rounded-2xl border border-border bg-background px-4 py-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-signature-blue/10 text-signature-blue">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Form */}
          <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">Send a message</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              We'll get back to you within one business day.
            </p>
            <div className="mt-5">
              <ContactForm />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}