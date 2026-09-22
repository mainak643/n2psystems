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
import { PageHero } from "@/components/ui/page-hero"
import { Section } from "@/components/ui/section"

export const metadata: Metadata = {
  title: "Partner With Us — Request a Quote | N2P Systems",
  description:
    "Request a custom quote from N2P Systems for consulting, AI integration, digital transformation, cloud infrastructure, or strategic advisory services.",
  alternates: {
    canonical: '/clients',
  },
}

/*
  Every contact point promises the same "within one business day" response
  — previously the email row said "24 hours" while the Response Time card
  and the form panel each said "one business day", so the page contradicted
  itself three times before a visitor even submitted anything.
*/
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
    value: "info@n2psystems.ca",
    detail: "We respond within one business day",
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
    title: "Confidential by Default",
    description:
      "Your requirements, candidate data, and commercial terms are handled under NDA and shared only with the people working your engagement.",
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
    <main>
      {/*
        The nav (desktop pill, Contact dropdown, footer) all call this
        destination "Partner With Us" — this page's own H1 used to say
        "Request a Quote" instead, so a visitor saw a third label right as
        they arrived. "Partner With Us" is now the H1 everywhere links to
        it; "Request a Quote" moves to the eyebrow, so the quote-request
        function stays visible without being the headline.
      */}
      <PageHero
        eyebrow="Request a Quote"
        title="Partner With Us"
        description="Tell us about your goals and challenges. Our team will prepare a tailored proposal covering scope, timeline, and investment — so you can make informed decisions."
      />

      {/* ── Trust indicators ── */}
      <Section tone="card" pad="compact" className="border-b border-border">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
          {trustPoints.map((point) => (
            <div key={point.title} className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] ring-1 ring-primary/10">
                <point.icon className="size-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-subtitle text-foreground">{point.title}</p>
                <p className="mt-1 text-caption text-muted-foreground">{point.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Main content ── */}
      <Section tone="frost">
        <div className="grid grid-cols-1 gap-6 sm:gap-16 lg:grid-cols-3">

          {/* ── Sidebar ── */}
          <div className="space-y-10 lg:col-span-1">
            {/* Contact info card */}
            <div className="surface p-5 sm:p-7">
              <h2 className="text-title text-foreground">Prefer to talk first?</h2>
              <p className="mt-2 text-body text-muted-foreground">
                Reach out directly — we're happy to discuss your needs before you commit to anything.
              </p>

              <div className="mt-6 space-y-3">
                {contactInfo.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3.5 rounded-xl border border-border bg-background px-4 py-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-overline uppercase text-muted-foreground/70">{item.label}</p>
                      <p className="mt-0.5 text-body text-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Services quick links */}
            <div className="surface p-5 sm:p-7">
              <h3 className="eyebrow">What We Offer</h3>
              <ul className="mt-5 space-y-2.5 text-body text-muted-foreground">
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
                    <span className="flex size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    {service}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href="/#services"
                  className="inline-flex items-center gap-1.5 text-caption font-semibold text-primary hover:underline"
                >
                  View All Services
                  <ArrowUpRight className="size-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          {/* ── Form ── */}
          <div className="order-first lg:order-last lg:col-span-2">
            <div className="surface p-5 sm:p-8">
              <h2 className="text-title text-foreground">Tell us about your project</h2>
              <p className="mt-2 text-body text-muted-foreground">
                Fill out the form below and we'll get back to you with a detailed quote within one business day.
              </p>
              <div className="mt-8">
                <ConsultationFormClient />
              </div>
            </div>
          </div>

        </div>
      </Section>
    </main>
  )
}
