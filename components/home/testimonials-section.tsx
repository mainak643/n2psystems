"use client"

import { Star, ChevronRight } from "lucide-react"
import { useRef, useState, useEffect } from "react"

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Track which card is snapped into view
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onScroll = () => {
      const cardWidth = el.scrollWidth / testimonials.length
      const index = Math.round(el.scrollLeft / cardWidth)
      setActiveIndex(Math.min(Math.max(index, 0), testimonials.length - 1))
    }

    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  const scrollTo = (index: number) => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.scrollWidth / testimonials.length
    el.scrollTo({ left: cardWidth * index, behavior: "smooth" })
  }

  return (
    <section className="relative overflow-hidden bg-frost pt-12 pb-10 sm:pt-14 sm:pb-12 lg:pt-20 lg:pb-16">
      {/* Ambient Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-1/4 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signature-blue/[0.06] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Section Header — unchanged */}
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

        {/*
          ─────────────────────────────────────────────────
          MOBILE  (<md): horizontal scroll-snap carousel
            • negative margin bleeds to screen edges
            • cards are 82vw so next card peeks ~10vw
            • scrollbar hidden
            • dot indicators below

          DESKTOP (md+): original 2-col / 3-col grid
            • overflow visible again, snap disabled
            • padding/margin reset to match original
          ─────────────────────────────────────────────────
        */}
        <div
          ref={scrollRef}
          className="
            -mx-5 px-5
            flex gap-4 overflow-x-auto snap-x snap-mandatory
            pb-4
            [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]

            md:mx-0 md:px-0
            md:grid md:grid-cols-2
            md:overflow-visible md:snap-none
            md:gap-8 md:pb-0
            xl:grid-cols-3
          "
        >
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="
                /* ── mobile card ── */
                w-[82vw] shrink-0 snap-center

                /* ── desktop card (resets mobile sizing) ── */
                md:w-auto md:shrink md:h-full

                group flex flex-col
                rounded-2xl border border-border bg-card
                p-6 sm:p-8
                transition-all duration-300
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

        {/*
          Mobile-only: dot indicators + card counter
          Hidden on md+ since desktop uses the plain grid
        */}
        <div className="mt-5 flex items-center justify-center gap-3 md:hidden">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={`
                rounded-full transition-all duration-300
                ${i === activeIndex
                  ? "w-6 h-2 bg-signature-blue"
                  : "w-2 h-2 bg-signature-blue/25 hover:bg-signature-blue/50"
                }
              `}
            />
          ))}
        </div>

        {/* Mobile-only: subtle swipe hint on first render */}
        {activeIndex === 0 && (
          <p className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground/60 md:hidden select-none">
            Swipe to see more
            <ChevronRight className="h-3 w-3" />
          </p>
        )}
      </div>
    </section>
  )
}