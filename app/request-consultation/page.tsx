import type { Metadata } from "next"
import Link from "next/link"
import { ConsultationFormClient } from "@/components/employer/consultation-form-client"
import {
  Phone,
  Mail,
  Clock,
  Globe,
  Shield,
  Zap,
  Users,
  ArrowUpRight,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Partner With Us — Request a Quote | N2P Systems",
  description:
    "Request a custom quote from N2P Systems for consulting, AI integration, digital transformation, cloud infrastructure, or strategic advisory services.",
}

const contactInfo = [
  {
    icon: Phone,
    label: "Canada & USA",
    value: "+1 (437) 335-9390",
    detail: "Mon – Fri, 9 AM – 6 PM EST",
  },
  {
    icon: Phone,
    label: "India",
    value: "+91 97760 47567",
    detail: "Mon – Fri, 10 AM – 7 PM IST",
  },
  {
    icon: Mail,
    label: "Email",
    value: "info@n2psystems.com",
    detail: "We respond within 24 hours",
  },
  {
    icon: Globe,
    label: "Operates In",
    value: "India, Canada, USA",
    detail: "Global delivery capabilities",
  },
  {
    icon: Clock,
    label: "Response Time",
    value: "Within 1 Business Day",
    detail: "For all quote requests",
  },
]

const trustPoints = [
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    description: "SOC-compliant processes and confidential data handling across all engagements.",
  },
  {
    icon: Zap,
    title: "Rapid Engagement",
    description: "From initial conversation to active project kickoff in as little as two weeks.",
  },
  {
    icon: Users,
    title: "Dedicated Account Team",
    description: "A single point of contact backed by domain-specific experts for your project.",
  },
]

export default function RequestConsultationPage() {
  return (
    <main className="bg-frost">
      {/* ── Hero Banner ── */}
      <section className="bg-navy pt-28 pb-12 sm:pt-32 sm:pb-16 md:pb-20 relative overflow-hidden texture-dots">
        <div className="absolute -right-20 top-1/4 w-96 h-96 rounded-full bg-signature-blue/5 blur-3xl" />
        <div className="absolute -left-20 bottom-1/4 w-64 h-64 rounded-full bg-tech-green/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-frost/10 bg-frost/[0.04] px-5 py-2">
              <span className="text-xs font-sans font-medium tracking-widest text-frost/70 uppercase">
                Partner With Us
              </span>
            </div>

            <h1 className="text-2xl font-sans font-bold tracking-tight text-frost sm:text-4xl lg:text-5xl text-balance leading-[1.15] sm:leading-[1.1]">
              Request a Quote
            </h1>
            <p className="mt-5 text-base text-frost/80 font-serif leading-relaxed sm:text-lg max-w-2xl mx-auto">
              Tell us about your goals and challenges. Our team will prepare a
              tailored proposal covering scope, timeline, and investment — so you
              can make informed decisions.
            </p>
          </div>
        </div>
      </section>

      {/* ── Trust Indicators ── */}
      <section className="border-b border-border bg-card py-10">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-3">
            {trustPoints.map((point) => (
              <div key={point.title} className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-signature-blue/8 ring-1 ring-signature-blue/10">
                  <point.icon className="size-5 text-signature-blue" />
                </div>
                <div>
                  <p className="text-sm font-sans font-semibold text-foreground">
                    {point.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground font-serif leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <section className="py-16 md:py-24 bg-frost">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 sm:gap-16 lg:grid-cols-3">

            {/* ── Sidebar ── */}
            <div className="lg:col-span-1 space-y-10">
              {/* Contact Info Card */}
              <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
                <h2 className="text-lg font-sans font-semibold text-foreground">
                  Prefer to talk first?
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground font-serif leading-relaxed">
                  Reach out directly — we're happy to discuss your needs before
                  you commit to anything.
                </p>

                <div className="mt-6 space-y-3">
                  {contactInfo.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3.5 rounded-xl border border-border bg-frost px-4 py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-signature-blue/10 text-signature-blue">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground font-sans">
                          {item.label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services Quick Links */}
              <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
                <h3 className="text-sm font-sans font-semibold text-foreground uppercase tracking-wider">
                  What We Offer
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground font-serif">
                  {[
                    "Consulting & Strategy Advisory",
                    "Digital Transformation",
                    "AI Integration & Automation",
                    "Program Management & Delivery",
                    "Cloud Hosting & Infrastructure",
                    "Learning & Enablement",
                    "Strategic Partnerships",
                  ].map((service) => (
                    <li key={service} className="flex items-center gap-2.5">
                      <span className="flex size-1.5 shrink-0 rounded-full bg-signature-blue" />
                      {service}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link
                    href="/#services"
                    className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-signature-blue hover:underline"
                  >
                    View All Services
                    <ArrowUpRight className="size-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Form ── */}
            <div className="lg:col-span-2 order-first lg:order-last">
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-8 shadow-sm">
                <h2 className="text-xl font-sans font-semibold text-foreground">
                  Tell us about your project
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground font-serif">
                  Fill out the form below and we'll get back to you with a
                  detailed quote within one business day.
                </p>
                <div className="mt-8">
                  <ConsultationFormClient />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  )
}
