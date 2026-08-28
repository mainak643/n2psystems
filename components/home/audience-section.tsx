import Link from "next/link"
import { ArrowRight, Briefcase, Building2, CheckCircle2 } from "lucide-react"

const audiences = [
  {
    icon: Briefcase,
    title: "For Tech Professionals",
    description:
      "Access exclusive opportunities at leading technology companies across three continents. Our precision-matching approach ensures every role aligns with your skills, ambitions, and career trajectory.",
    benefits: [
      "Exclusive global technology roles",
      "Personalized career consultation",
      "Cross-border placement support",
      "Salary benchmarking insights",
    ],
    cta: "Explore Opportunities",
    href: "/jobs",
    accentClass: "bg-tech-green",
  },
  {
    icon: Building2,
    title: "For Employers",
    description:
      "Build high-performance technology teams with pre-vetted specialists. Our structured methodology delivers qualified candidates faster, with measurably higher retention rates.",
    benefits: [
      "Pre-vetted specialist talent",
      "Structured hiring methodology",
      "Reduced time-to-fill metrics",
      "Industry-specific expertise",
    ],
    cta: "Explore Solutions",
    href: "/hiring-solutions",
    accentClass: "bg-signature-blue",
  },
]

export function AudienceSection() {
  return (
    <section className="py-16 lg:py-32 bg-card relative">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 section-divider pb-6">
          <p className="text-sm font-sans font-semibold uppercase tracking-widest text-signature-blue mb-3">
            Who We Serve
          </p>
          <h2 className="font-sans font-bold text-3xl tracking-tight text-foreground sm:text-4xl text-balance">
            Precision-Driven Solutions for Both Sides of the Hiring Equation
          </h2>
        </div>

        {/* Audience Cards */}
        <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-2">
          {audiences.map((audience) => (
            <div
              key={audience.title}
              className="group relative rounded-2xl border border-border bg-card p-6 lg:p-10 transition-all card-lift hover:border-signature-blue/20 overflow-hidden"
            >
              {/* Subtle top accent bar */}
              <div
                className={`absolute left-0 right-0 top-0 h-1 ${audience.accentClass} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
              />

              {/* Icon */}
              <div className="mb-6 flex size-14 items-center justify-center rounded-xl bg-signature-blue/8 ring-1 ring-signature-blue/10">
                <audience.icon className="size-6 text-signature-blue" />
              </div>

              {/* Content */}
              <h3 className="font-sans font-bold text-xl text-foreground">
                {audience.title}
              </h3>
              <p className="mt-3 text-muted-foreground leading-relaxed font-serif">
                {audience.description}
              </p>

              {/* Benefits */}
              <ul className="mt-6 flex flex-col gap-3">
                {audience.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="size-4 shrink-0 text-tech-green" />
                    {benefit}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={audience.href}
                className="mt-8 inline-flex items-center gap-2 text-sm font-sans font-semibold text-signature-blue transition-colors hover:text-sky-600 group/link"
              >
                {audience.cta}
                <ArrowRight className="size-4 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
