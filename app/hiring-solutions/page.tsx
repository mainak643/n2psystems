import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Users,
  UserCheck,
  Repeat,
  Search,
  Building2,
  Globe,
  Clock,
  ShieldCheck,
  ArrowRight,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Hiring Solutions | N2P Systems",
  description:
    "Discover how N2P Systems helps organizations build high-performing technology teams through Contract staffing, Contract-to-Hire, and Permanent Placement solutions.",
  alternates: {
    canonical: "/hiring-solutions",
  },
}

const services = [
  {
    icon: Users,
    title: "Contract Staffing",
    description:
      "Scale your team with pre-vetted technology professionals for project-based or short-term engagements. We handle sourcing, screening, and onboarding so you can focus on delivery.",
  },
  {
    icon: UserCheck,
    title: "Permanent Placement",
    description:
      "Find your next long-term team member. We identify, assess, and present candidates who align with both the technical requirements and culture of your organization.",
  },
  {
    icon: Repeat,
    title: "Contract-to-Hire",
    description:
      "Reduce hiring risk with our contract-to-hire model. Evaluate candidates on the job before making a permanent commitment, ensuring the right fit for both parties.",
  },
  {
    icon: Search,
    title: "Executive Search",
    description:
      "Confidential, targeted search for senior technology leaders. Our executive practice specializes in CTO, VP Engineering, and Director-level placements.",
  },
  {
    icon: Building2,
    title: "Managed Teams & RPO",
    description:
      "Outsource your entire recruitment function or build dedicated offshore development teams. We manage the hiring pipeline end-to-end with full transparency.",
  },
  {
    icon: Globe,
    title: "Global Talent Access",
    description:
      "Leverage our tri-country presence to access talent pools across Canada, the United States, and India. Ideal for distributed teams and nearshore/offshore models.",
  },
]

const differentiators = [
  {
    icon: Clock,
    stat: "48 hrs",
    label: "Average time to first qualified candidate shortlist",
  },
  {
    icon: ShieldCheck,
    stat: "92%",
    label: "Offer acceptance rate across all placements",
  },
  {
    icon: Users,
    stat: "50,000+",
    label: "Pre-screened technology professionals in our network",
  },
  {
    icon: Globe,
    stat: "3",
    label: "Countries with on-the-ground recruitment teams",
  },
]

export default function HiringSolutionsPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-navy pt-32 pb-16 md:pb-24 relative overflow-hidden texture-dots">
        <div className="absolute -right-20 top-1/3 w-80 h-80 rounded-full bg-signature-blue/5 blur-3xl" />
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-frost/10 bg-frost/[0.04] px-5 py-2">
              <span className="text-xs font-sans font-medium tracking-widest text-frost/70 uppercase">
                For Employers
              </span>
            </div>
            <h1 className="text-3xl font-sans font-bold tracking-tight text-frost sm:text-4xl lg:text-5xl text-balance leading-[1.1]">
              Technology Hiring Solutions Built for Scale
            </h1>
            <p className="mt-6 text-lg text-frost/80 leading-relaxed font-serif">
              Whether you need one specialist or an entire team, N2P Systems
              delivers qualified technology talent with speed, precision, and
              transparency.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="bg-signature-blue text-primary-foreground hover:bg-cyan-support transition-all rounded-lg px-8 shadow-lg shadow-signature-blue/25"
              >
                <Link href="/clients">
                  Request a Consultation
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="bg-card py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16 section-divider pb-6">
            <p className="text-sm font-sans font-semibold uppercase tracking-widest text-signature-blue mb-3">
              Our Service Models
            </p>
            <h2 className="text-2xl font-sans font-bold text-foreground sm:text-3xl text-balance">
              Flexible engagement models tailored to your hiring timelines,
              budget, and team structure.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.title}
                className="group rounded-2xl border border-border bg-card p-8 transition-all card-lift hover:border-signature-blue/15"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-signature-blue/8 ring-1 ring-signature-blue/10 transition-all group-hover:bg-signature-blue/12">
                  <service.icon className="size-5 text-signature-blue" />
                </div>
                <h3 className="mt-5 text-lg font-sans font-semibold text-foreground">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed font-serif">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="bg-frost py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-tech-green/3 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-2xl font-sans font-bold text-foreground sm:text-3xl text-balance">
              Why Employers Choose N2P
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {differentiators.map((item) => (
              <div key={item.label} className="text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-tech-green/8 ring-1 ring-tech-green/10 mb-5">
                  <item.icon className="size-6 text-tech-green" />
                </div>
                <p className="text-3xl font-sans font-bold text-foreground tracking-tight">
                  {item.stat}
                </p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed font-serif">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-signature-blue py-20 relative overflow-hidden texture-grain">
        <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full bg-cyan-support/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-sans font-bold text-primary-foreground sm:text-3xl text-balance">
            Ready to Build Your Team?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/90 leading-relaxed max-w-2xl mx-auto font-serif">
            Schedule a no-obligation consultation and let us show you how we
            can accelerate your hiring.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-card text-signature-blue hover:bg-frost transition-all rounded-lg px-8 shadow-lg"
          >
            <Link href="/clients">
              Get Started Today
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
