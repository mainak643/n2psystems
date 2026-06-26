import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Globe,
  Users,
  Award,
  Target,
  ArrowRight,
  MapPin,
} from "lucide-react"

export const metadata: Metadata = {
  title: "About Us | N2P Systems",
  description:
    "Learn about N2P Systems, a global technology recruitment consultancy with operations in Canada, USA, and India. Discover our mission, values, and leadership.",
}

const stats = [
  { value: "12+", label: "Years in business" },
  { value: "5,000+", label: "Placements completed" },
  { value: "500+", label: "Client organizations" },
  { value: "3", label: "Countries" },
]

const values = [
  {
    icon: Target,
    title: "Precision Matching",
    description:
      "We go beyond keyword matching. Every candidate is assessed for technical depth, cultural alignment, and career trajectory to ensure lasting placements.",
  },
  {
    icon: Users,
    title: "Relationship-First",
    description:
      "We build long-term partnerships with both candidates and employers. Our repeat engagement rate of 85% speaks to the trust we earn.",
  },
  {
    icon: Globe,
    title: "Global Perspective",
    description:
      "With recruiters on the ground in Toronto, New York, and Hyderabad, we understand local markets while operating with a global mindset.",
  },
  {
    icon: Award,
    title: "Domain Expertise",
    description:
      "Our recruiters specialize in the technologies they recruit for. They speak the language of the teams they serve.",
  },
]

const offices = [
  {
    city: "Toronto",
    country: "Canada",
    address: "200 Bay Street, Suite 1800",
    region: "Headquarters",
  },
  {
    city: "New York",
    country: "USA",
    address: "1345 Avenue of the Americas, Floor 33",
    region: "US Operations",
  },
  {
    city: "Hyderabad",
    country: "India",
    address: "HITEC City, Cyber Towers, Tower B",
    region: "APAC Operations",
  },
]

export default function AboutPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-navy pt-28 pb-12 sm:pt-32 sm:pb-16 md:pb-24 relative overflow-hidden texture-dots">
        <div className="absolute -right-20 top-1/4 w-96 h-96 rounded-full bg-signature-blue/5 blur-3xl" />
        <div className="absolute -left-20 bottom-1/4 w-64 h-64 rounded-full bg-tech-green/5 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-8 sm:gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-frost/10 bg-frost/[0.04] px-5 py-2">
                <span className="text-xs font-sans font-medium tracking-widest text-frost/70 uppercase">
                  About N2P Systems
                </span>
              </div>
              <h1 className="text-2xl font-sans font-bold tracking-tight text-frost sm:text-4xl lg:text-5xl text-balance leading-[1.15] sm:leading-[1.1]">
                Connecting Talent with Opportunity Since 2013
              </h1>
              <p className="mt-4 sm:mt-6 text-[15px] sm:text-lg text-frost/80 leading-relaxed font-serif">
                N2P Systems is a global technology recruitment consultancy that
                helps organizations build high-performing teams and empowers
                professionals to advance their careers. With deep domain
                expertise and a tri-country presence, we bridge the gap between
                exceptional talent and the companies that need them.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl aspect-[4/3] ring-1 ring-frost/10">
              <Image
                src="/images/team-meeting.jpg"
                alt="N2P Systems team collaborating in a modern office"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-sans font-bold text-signature-blue sm:text-4xl tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground font-serif">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-card py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center section-divider pb-6">
            <h2 className="text-2xl font-sans font-bold text-foreground sm:text-3xl text-balance">
              Our Mission
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed font-serif">
              To be the most trusted partner in technology recruitment by
              delivering exceptional talent experiences. We believe that when
              the right person meets the right opportunity, extraordinary
              things happen -- for individuals, for teams, and for the
              organizations they serve.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-frost py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 w-[500px] h-[300px] -translate-x-1/2 rounded-full bg-signature-blue/[0.02] blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-10 sm:mb-16">
            <h2 className="text-2xl font-sans font-bold text-foreground sm:text-3xl text-balance">
              What Sets Us Apart
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {values.map((value) => (
              <div
                key={value.title}
                className="flex gap-4 sm:gap-5 rounded-2xl border border-border bg-card p-5 sm:p-8 card-lift"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-tech-green/8 ring-1 ring-tech-green/10">
                  <value.icon className="size-5 text-tech-green" />
                </div>
                <div>
                  <h3 className="text-lg font-sans font-semibold text-foreground">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed font-serif">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Offices */}
      <section className="bg-card py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-10 sm:mb-16 section-divider pb-6">
            <h2 className="text-2xl font-sans font-bold text-foreground sm:text-3xl text-balance">
              Our Global Presence
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed font-serif">
              Three offices, one unified approach to recruitment excellence.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {offices.map((office) => (
              <div
                key={office.city}
                className="rounded-2xl border border-border bg-card p-6 sm:p-8 text-center card-lift"
              >
                <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-signature-blue/8 ring-1 ring-signature-blue/10 mb-5">
                  <MapPin className="size-5 text-signature-blue" />
                </div>
                <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
                  {office.region}
                </p>
                <h3 className="mt-2 text-xl font-sans font-bold text-foreground">
                  {office.city}, {office.country}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground font-serif">
                  {office.address}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-signature-blue py-14 sm:py-20 relative overflow-hidden texture-grain">
        <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full bg-cyan-support/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-sans font-bold text-primary-foreground sm:text-3xl text-balance">
            Want to Learn More?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/90 leading-relaxed max-w-2xl mx-auto font-serif">
            Whether you are exploring career opportunities or looking to hire
            world-class talent, we would love to hear from you.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="bg-card text-signature-blue hover:bg-frost transition-all rounded-lg px-8 shadow-lg"
            >
              <Link href="/#contact">
                Contact Us
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 rounded-lg px-8"
            >
              <Link href="/jobs">Browse Open Roles</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
