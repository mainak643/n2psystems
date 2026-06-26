import { Star } from "lucide-react"

const testimonials = [
  {
    quote:
      "N2P Systems helped us modernize critical business processes and streamline operations across multiple departments. Their team combined technical expertise with a strong understanding of our business objectives.",
    author: "Sarah Chen",
    role: "VP of Engineering",
    company: "Nextera Technologies",
    rating: 5,
    avatarBg: "bg-primary/20",
    avatarText: "text-primary",
  },
  {
    quote:
      "Their consultants quickly understood our challenges and delivered practical solutions that improved efficiency and reduced implementation timelines. The collaboration was professional from start to finish.",
    author: "Michael Torres",
    role: "CTO",
    company: "DataStream Solutions",
    rating: 5,
    avatarBg: "bg-indigo-500/20",
    avatarText: "text-indigo-300",
  },
  {
    quote:
      "From solution design to deployment, N2P Systems provided exceptional support. Their responsiveness, technical knowledge, and commitment to results made them a trusted partner throughout the project.",
    author: "Priya Sharma",
    role: "Director of Operations",
    company: "FinovateAI",
    rating: 5,
    avatarBg: "bg-sky-500/20",
    avatarText: "text-sky-300",
  },
]

export function TestimonialsSection() {
  return (
    // FIX: top padding trimmed (was pt-24 lg:pt-32) — too much dead space under the section above
    <section className="relative overflow-hidden bg-frost pt-12 pb-10 sm:pt-14 sm:pb-12 lg:pt-20 lg:pb-16">
      {/* Ambient Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-1/4 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signature-blue/[0.06] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-8 sm:mb-12 max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-signature-blue">
            Client Testimonials
          </p>

          <h2 className="mb-4 sm:mb-5 font-sans text-2xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl text-balance">
            What Our Clients Say
          </h2>

          <p className="mx-auto max-w-2xl text-[15px] sm:text-lg leading-relaxed text-muted-foreground">
            We take pride in building long-term relationships and delivering
            meaningful business outcomes for our clients.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 md:grid-cols-2 xl:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="
                group
                flex
                h-full
                flex-col
                rounded-2xl
                border
                border-border
                bg-card
                p-6 sm:p-8
                transition-all
                duration-300
                hover:-translate-y-1
                hover:border-signature-blue/25
                hover:shadow-xl
              "
            >
              {/* Stars + Quote Mark Row */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                <span
                  aria-hidden="true"
                  className="text-5xl leading-none text-signature-blue/15 select-none"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  {"\u201C"}
                </span>
              </div>

              {/* Testimonial Text */}
              <blockquote className="flex-1 text-[15px] leading-relaxed text-foreground/85">
                {testimonial.quote}
              </blockquote>

              {/* Client Information */}
              <div className="mt-8 flex items-center gap-4 border-t border-border pt-6">
                <div
                  className={`
                    flex h-12 w-12 shrink-0
                    items-center justify-center
                    rounded-full
                    ${testimonial.avatarBg}
                  `}
                >
                  <span className={`text-sm font-bold ${testimonial.avatarText}`}>
                    {testimonial.author
                      .split(" ")
                      .map((name) => name[0])
                      .join("")}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="font-semibold text-foreground">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                  <div className="text-sm font-semibold text-primary/90">
                    {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}