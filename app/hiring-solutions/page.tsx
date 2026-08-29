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
import { PageHero } from "@/components/ui/page-hero"
import { Section } from "@/components/ui/section"

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

/*
  Previously four bare stat tiles (48 hrs / 92% / 50,000+ / 3) with no
  methodology or date range — unsourced precision that reads as template
  filler to an experienced buyer, not as evidence. Restructured as the same
  qualitative-claim pattern as the services grid above, softened to what's
  actually defensible. "Three countries" is kept as-is: it's verifiable and
  stated elsewhere on the site.
*/
const differentiators = [
  {
    icon: Clock,
    title: "Shortlists in days, not weeks",
    description:
      "We work to a first qualified shortlist quickly, and tell you up front when a search will take longer.",
  },
  {
    icon: ShieldCheck,
    title: "Candidates who show up prepared",
    description:
      "We brief on scope, team, and compensation before an interview, so offers land with people who already want the role.",
  },
  {
    icon: Users,
    title: "A specialist network, not a scraped list",
    description:
      "Built role by role across software, cloud, data, security, and product leadership.",
  },
  {
    icon: Globe,
    title: "Three countries",
    description: "On-the-ground recruitment teams in Canada, the United States, and India.",
  },
]

export default function HiringSolutionsPage() {
  return (
    <main>
      <PageHero
        eyebrow="For Employers"
        title="Technology Hiring Solutions Built for Scale"
        description="Whether you need one specialist or an entire team, N2P Systems delivers qualified technology talent with speed, precision, and transparency."
        actions={
          <Button asChild variant="brand" size="xl">
            <Link href="/clients">
              Request a Consultation
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      {/* Service models */}
      <Section tone="card">
        <div className="mx-auto mb-14 max-w-2xl text-center sm:mb-16">
          <p className="eyebrow eyebrow-center mb-4 justify-center">Our Service Models</p>
          {/*
            text-title, not text-heading: this is a full descriptive
            sentence rather than a short headline, and at the display
            size it wrapped to four oversized lines that dominated the
            section disproportionately.
          */}
          <h2 className="text-title text-balance text-foreground">
            Flexible engagement models tailored to your hiring timelines, budget, and team structure.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div key={service.title} className="surface surface-interactive p-7 sm:p-8">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/[0.08] ring-1 ring-primary/10">
                <service.icon className="size-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-subtitle text-foreground">{service.title}</h3>
              <p className="mt-2.5 text-body text-muted-foreground">{service.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Differentiators */}
      <Section tone="frost">
        <div className="mx-auto mb-14 max-w-2xl text-center sm:mb-16">
          <h2 className="text-heading text-balance text-foreground">Why Employers Choose N2P</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {differentiators.map((item) => (
            <div key={item.title} className="surface p-6 text-center">
              <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-xl bg-primary/[0.08] ring-1 ring-primary/10">
                <item.icon className="size-5 text-primary" aria-hidden="true" />
              </div>
              <p className="text-subtitle text-foreground">{item.title}</p>
              <p className="mt-2 text-body text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section tone="brand" className="text-center">
        <h2 className="text-heading text-balance">Ready to Build Your Team?</h2>
        <p className="measure mx-auto mt-4 text-lead text-primary-foreground/85">
          Schedule a no-obligation consultation and let us show you how we can accelerate your hiring.
        </p>
        <Button asChild variant="on-brand" size="xl" className="mt-8">
          <Link href="/clients">
            Get Started Today
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </Section>
    </main>
  )
}
