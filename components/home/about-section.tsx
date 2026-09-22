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
      aria-labelledby="about-heading"
      className="section-y relative overflow-hidden bg-card"
    >
      <div className="container-page relative">
        <div className="grid grid-cols-1 gap-10 sm:gap-14 lg:grid-cols-2 lg:items-start">

          {/* ── Left / text side ── */}
          <div className="max-w-2xl">
            <p className="eyebrow mb-4">About N2P Systems</p>

            <h2
              id="about-heading"
              className="text-heading text-balance text-foreground"
            >
              A Trusted Technology Partner for Modern Businesses
            </h2>

            {/* Credibility strip — shared by all viewports */}
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-overline uppercase text-muted-foreground/70">
              <span>10+ Years</span>
              <span className="text-border" aria-hidden="true">/</span>
              <span>Canada</span>
              <span className="text-border" aria-hidden="true">/</span>
              <span>USA</span>
              <span className="text-border" aria-hidden="true">/</span>
              <span>India</span>
            </div>

            {/* Narrative text */}
            <div className="measure mt-6 space-y-4 text-pretty text-lead text-muted-foreground">
              <p>
                With over a decade of delivering technology solutions across
                North America, N2P Systems has become a trusted partner for
                organizations seeking innovation, operational efficiency, and
                sustainable growth.
              </p>
              {/*
                Previously `hidden sm:block` on both paragraphs below, which
                removed them from mobile — visually and from the a11y tree,
                since `hidden` is `display:none`. That dropped the one
                paragraph that actually names N2P's services (consulting,
                digital transformation, AI, cloud, hosting) for every phone
                visitor and every mobile screen-reader user. Shown on all
                breakpoints now; `space-y-4` above already gives each
                paragraph room, so no extra spacing/typography change needed.
              */}
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

            {/* Highlight cards — visible on all devices */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-5">
              {highlights.map((item) => (
                <article
                  key={item.title}
                  className="surface surface-interactive group p-5 sm:p-6"
                  style={{ background: "var(--background)" }}
                >
                  <div className="mb-4 sm:mb-5 flex size-11 sm:size-12 items-center justify-center rounded-xl bg-navy/[0.04] ring-1 ring-navy/[0.06] transition-all duration-300 group-hover:bg-signature-blue/10 group-hover:ring-signature-blue/20">
                    <item.icon
                      className="size-5 text-navy/70 transition-colors duration-300 group-hover:text-signature-blue"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-subtitle text-foreground">{item.title}</h3>
                  <p className="mt-2 text-body text-muted-foreground">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>

            {/*
              ── Trust & Focus panel ──
              One panel for every breakpoint. Mobile and desktop
              previously had separate implementations of this block with
              different content — mobile silently dropped the Focus Areas
              — so the two drifted apart every time either was touched.
            */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-navy p-6 shadow-e4 sm:p-8">
              {/* Single directional wash instead of scattered blur circles. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(30,99,181,0.22),transparent_62%)]"
              />
              {/* Top edge highlight — the detail that reads as depth. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />

              <div className="relative flex items-start gap-4">
                <div className="flex size-11 flex-shrink-0 items-center justify-center rounded-xl bg-tech-green/[0.12] ring-1 ring-tech-green/20">
                  <Handshake className="size-5 text-tech-green" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-subtitle text-frost">
                    Long-term partnership, not one-off projects
                  </p>
                  <p className="mt-2 text-body text-frost/65">
                    We stay involved after delivery, with clear communication
                    and consistent follow-through on every engagement.
                  </p>
                </div>
              </div>

              <div className="relative my-7 h-px w-full bg-frost/10" />

              <div className="relative">
                <p className="text-overline uppercase text-frost/50">Focus Areas</p>
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {focusAreas.map((area) => (
                    <span
                      key={area}
                      className="rounded-full border border-frost/[0.12] bg-frost/[0.05] px-3.5 py-1.5 text-caption text-frost/80 transition-colors hover:bg-frost/10 hover:text-white"
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