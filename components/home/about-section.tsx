import {
  Globe,
  Handshake,
} from "lucide-react"

const highlights = [
  {
    icon: Globe,
    title: "North American Presence",
    description:
      "Supporting organizations across Canada, the United States, and beyond.",
  },
  {
    icon: Handshake,
    title: "Trusted Partnerships",
    description:
      "Building long-term relationships based on reliability, expertise, and results.",
  },
]

const focusAreas = [
  "Consulting",
  "Digital Transformation",
  "AI Integration",
  "Cloud Solutions",
  "Managed Hosting",
]

export function AboutSection() {
  return (
    <section
      id="about"
      className="relative scroll-mt-24 overflow-hidden bg-card pb-12 pt-10 sm:pt-24 lg:pb-12 lg:pt-32"
    >
      <div className="absolute inset-0 opacity-60">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-signature-blue/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-tech-green/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:gap-14 lg:grid-cols-2 lg:items-start">

          {/* ── Left / text side ── */}
          <div className="max-w-2xl">
            <p className="mb-2 sm:mb-3 text-sm font-bold uppercase tracking-[0.24em] text-signature-blue">
              About N2P Systems
            </p>

            <h2 className="text-balance font-sans text-2xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              A Trusted Technology Partner for Modern Businesses
            </h2>

            {/* MOBILE: subtle meta line + short paragraph only */}
            <div className="mt-3.5 sm:hidden">
              <p className="mb-2.5 text-[11px] font-medium tracking-wider text-muted-foreground/60 uppercase">
                10+ Years &nbsp;·&nbsp; Canada &nbsp;·&nbsp; USA &nbsp;·&nbsp; India
              </p>
              <p className="text-[14px] leading-relaxed text-muted-foreground">
                N2P Systems partners with organizations across North America to
                modernize operations, integrate AI, and accelerate growth through
                consulting, cloud, and managed services.
              </p>
            </div>

            {/* DESKTOP: original three paragraphs — untouched */}
            <div className="hidden sm:block mt-5 sm:mt-6 space-y-3 sm:space-y-4 text-pretty text-[15px] sm:text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                With over a decade of delivering technology solutions across
                North America, N2P Systems has become a trusted partner for
                organizations seeking innovation, operational efficiency, and
                sustainable growth.
              </p>
              <p>
                We help businesses leverage modern technologies to transform
                operations, enhance customer experiences, and accelerate digital
                initiatives through consulting, digital transformation, AI
                integration, cloud solutions, and managed hosting services.
              </p>
              <p>
                By combining industry expertise with a customer-centric approach,
                we deliver tailored solutions designed to solve complex business
                challenges and create measurable outcomes.
              </p>
            </div>
          </div>

          {/* ── Right / cards side ── */}
          <div className="grid gap-4 sm:gap-5">

            {/* Highlight cards — desktop only */}
            <div className="hidden sm:grid grid-cols-1 gap-5 sm:grid-cols-2">
              {highlights.map((item) => (
                <article
                  key={item.title}
                  className="group rounded-2xl border border-border bg-background p-5 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-signature-blue/15"
                >
                  <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-navy/[0.04] ring-1 ring-navy/[0.06] transition-all duration-300 group-hover:bg-signature-blue/10 group-hover:ring-signature-blue/15">
                    <item.icon className="size-5 text-navy/70 transition-colors duration-300 group-hover:text-signature-blue" />
                  </div>
                  <h3 className="font-sans text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>

            {/* ── MOBILE: Premium Feature Block ── */}
            <div className="sm:hidden group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-navy to-[#0a1222] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:border-signature-blue/30">
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-signature-blue/20 blur-[60px] transition-all duration-500 group-hover:bg-signature-blue/30" />
              <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-tech-green/20 blur-[50px] transition-all duration-500 group-hover:bg-tech-green/30" />

              <div className="relative flex flex-col items-start gap-4">
                <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-tech-green/20 to-tech-green/5 ring-1 ring-tech-green/25 shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-transform duration-300 group-hover:scale-105">
                  <Handshake className="size-6 text-tech-green drop-shadow-md" />
                </div>
                <div className="flex-1">
                  <p className="text-[17px] font-bold tracking-tight text-white">
                    Long-term partnership, not one-off projects
                  </p>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-frost/75">
                    We stay involved after delivery, with clear communication
                    and consistent follow-through on every engagement.
                  </p>
                </div>
              </div>
            </div>

            {/* ── DESKTOP: Original Trust & Focus panel ── */}
            <div className="hidden sm:block relative overflow-hidden rounded-3xl border border-border bg-navy p-8 shadow-xl">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-signature-blue/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-tech-green/10 blur-3xl" />

              <div className="relative flex items-start gap-3">
                <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-tech-green/15">
                  <Handshake className="size-5 text-tech-green" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-frost">
                    Long-term partnership, not one-off projects
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-frost/65">
                    We stay involved after delivery, with clear communication
                    and consistent follow-through on every engagement.
                  </p>
                </div>
              </div>

              <div className="relative my-6 h-px w-full bg-frost/10" />

              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-frost/80">
                  Focus Areas
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {focusAreas.map((area) => (
                    <span
                      key={area}
                      className="rounded-full border border-frost/15 bg-frost/[0.06] px-3.5 py-1.5 text-sm text-frost/80 transition-colors hover:bg-frost/10 hover:text-white"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}