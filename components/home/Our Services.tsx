"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import Link from "next/link"
import {
  Lightbulb,
  ClipboardCheck,
  Sparkles,
  BrainCircuit,
  ServerCog,
  BookOpenCheck,
  Handshake,
  ArrowRight,
  ArrowUpRight,
  Pause,
  Play,
} from "lucide-react"

const AUTOPLAY_MS = 4000

const services = [
  {
    icon: Lightbulb,
    title: "Consulting",
    description:
      "Strategic technology and business consulting to help organizations solve challenges, optimize operations, and achieve growth objectives.",
  },
  {
    icon: ClipboardCheck,
    title: "Program Management & Delivery",
    description:
      "End-to-end management and delivery of technology initiatives, ensuring successful execution and alignment with business goals.",
  },
  {
    icon: Sparkles,
    title: "Digital Transformation",
    description:
      "Modernize business operations through process automation, cloud adoption, and technology-driven improvements.",
  },
  {
    icon: BrainCircuit,
    title: "AI Integration",
    description:
      "Implement AI-powered solutions that improve productivity, automate workflows, and enable data-driven decision-making.",
  },
  {
    icon: ServerCog,
    title: "Hosting Services",
    description:
      "Secure, scalable hosting and cloud infrastructure solutions designed for business-critical applications.",
  },
  {
    icon: BookOpenCheck,
    title: "Learning & Enablement",
    description:
      "Support technology adoption through training, user enablement, and knowledge-sharing initiatives.",
  },
]

const closingService = {
  icon: Handshake,
  title: "Strategic Partnerships",
  description:
    "Collaborate with technology providers and business partners to deliver integrated solutions and long-term value.",
  isClosing: true,
}

const allCards = [...services, closingService]

export function SpecializationSection() {
  const scrollRef = useRef<HTMLDivElement>(null)
  /* Mirrors activeIndex so the autoplay tick can read it without
     re-creating the interval on every slide change. */
  const activeIndexRef = useRef(0)

  const [activeIndex, setActiveIndex] = useState(0)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isTabVisible, setIsTabVisible] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  /* Autoplay only runs when nothing says otherwise. */
  const autoplayActive =
    !hasInteracted && !isPaused && isTabVisible && !prefersReducedMotion

  const setActive = useCallback((index: number) => {
    activeIndexRef.current = index
    setActiveIndex(index)
  }, [])

  /*
    Card centre positions, measured once per layout rather than on every
    scroll event. Reading offsetLeft/offsetWidth forces a synchronous
    layout; doing that for all seven cards on each of the ~60 scroll
    events a second that a smooth scroll emits is pure layout thrash.
  */
  const cardCentresRef = useRef<number[]>([])
  const rafRef = useRef<number | null>(null)

  const measureCards = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    cardCentresRef.current = Array.from(
      el.querySelectorAll<HTMLElement>("article"),
    ).map((card) => card.offsetLeft + card.offsetWidth / 2)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    measureCards()
    const observer = new ResizeObserver(measureCards)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measureCards])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  /* ── scroll to a card by index ── */
  const goTo = useCallback(
    (index: number) => {
      const el = scrollRef.current
      if (!el) return
      const centre = cardCentresRef.current[index]
      if (centre === undefined) return
      el.scrollTo({
        left: centre - el.clientWidth / 2,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      })
      setActive(index)
    },
    [prefersReducedMotion, setActive],
  )

  /* ── track the reduced-motion preference ── */
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setPrefersReducedMotion(query.matches)
    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])

  /* ── pause autoplay while the tab is in the background ── */
  useEffect(() => {
    const onVisibility = () =>
      setIsTabVisible(document.visibilityState === "visible")
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])

  /*
    ── autoplay ──
    The advance happens in an effect rather than inside a setState
    updater. Scrolling from within an updater is a side effect, which
    React StrictMode double-invokes — that made the carousel skip a
    card on every tick in development.
  */
  useEffect(() => {
    if (!autoplayActive) return
    const id = setInterval(() => {
      goTo((activeIndexRef.current + 1) % allCards.length)
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [autoplayActive, goTo])

  /*
    ── sync the active dot while the user swipes ──
    Picks the card whose centre sits closest to the viewport centre.
    The previous scrollLeft-ratio calculation assumed cards were evenly
    distributed across the full scroll width, so it reported the wrong
    card for everything except the first and last.
  */
  const handleScroll = useCallback(() => {
    /* Coalesce the scroll burst into one read per frame. */
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const el = scrollRef.current
      const centres = cardCentresRef.current
      if (!el || centres.length === 0) return

      const viewportCentre = el.scrollLeft + el.clientWidth / 2
      let nearest = 0
      let smallestDelta = Number.POSITIVE_INFINITY
      for (let i = 0; i < centres.length; i++) {
        const delta = Math.abs(centres[i] - viewportCentre)
        if (delta < smallestDelta) {
          smallestDelta = delta
          nearest = i
        }
      }

      /* Only re-render when the highlighted card actually changes. */
      if (nearest !== activeIndexRef.current) {
        activeIndexRef.current = nearest
        setActiveIndex(nearest)
      }
    })
  }, [])

  /* ── a swipe or drag hands control to the user for good ── */
  const handleInteraction = useCallback(() => {
    setHasInteracted(true)
  }, [])

  /* ── dot click: jump + stop autoplay ── */
  const handleDotClick = (index: number) => {
    setHasInteracted(true)
    goTo(index)
  }

  /*
    No local scroll-mt on the section: the anchor offset comes from
    html { scroll-padding-top } in globals.css. A scroll-margin on the
    target would stack on top of that padding and overshoot the heading.
  */
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="section-y relative overflow-hidden bg-frost"
    >
      <style>{`
        @keyframes n2p-fill {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>

      <div className="container-page relative">

        {/* ── Section header ── */}
        <div className="mb-9 max-w-3xl sm:mb-16">
          <p className="eyebrow mb-4">Our Services</p>
          <h2
            id="services-heading"
            className="text-heading text-balance text-foreground"
          >
            Technology Solutions Built for Modern Business
          </h2>
          <p className="measure mt-5 text-pretty text-lead text-muted-foreground">
            From consulting and digital transformation to AI integration and cloud
            infrastructure, we help organizations modernize operations, improve
            efficiency, and accelerate business growth.
          </p>
        </div>

        {/* ════════════════════════════════
            MOBILE — auto-scroll carousel
        ════════════════════════════════ */}
        <div className="sm:hidden">
          <div className="mb-3 flex items-center justify-between gap-2 pr-2 text-muted-foreground/70">
            {/*
              WCAG 2.2.2 — auto-advancing content needs an explicit
              pause control. Swiping already stops it, but that is not
              reachable by keyboard or assistive tech.
            */}
            {autoplayActive || isPaused ? (
              <button
                type="button"
                onClick={() => setIsPaused((paused) => !paused)}
                aria-label={
                  isPaused ? "Resume automatic scrolling" : "Pause automatic scrolling"
                }
                className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-overline uppercase transition-colors hover:text-foreground"
              >
                {isPaused ? (
                  <Play className="size-3" aria-hidden="true" />
                ) : (
                  <Pause className="size-3" aria-hidden="true" />
                )}
                {isPaused ? "Play" : "Pause"}
              </button>
            ) : (
              <span aria-hidden="true" />
            )}

            <span className="flex items-center gap-1.5">
              <span className="text-overline uppercase">Swipe to explore</span>
              <ArrowRight className="size-3 animate-pulse" aria-hidden="true" />
            </span>
          </div>
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            onTouchStart={handleInteraction}
            onPointerDown={handleInteraction}
            role="group"
            aria-roledescription="carousel"
            aria-label="Our services"
            className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth gap-3.5 -mx-[var(--gutter)] px-[var(--gutter)] pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {allCards.map((card, i) => {
              const isClosing = "isClosing" in card && card.isClosing
              const Icon = card.icon
              const isActive = i === activeIndex

              return (
                <article
                  key={card.title}
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${allCards.length}: ${card.title}`}
                  className={`
                    surface flex w-[min(84vw,340px)] flex-shrink-0 snap-center flex-col p-6
                    ${isActive
                      ? "border-signature-blue/25 shadow-e3"
                      : "opacity-70"
                    }
                  `}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div
                      className={`flex size-11 items-center justify-center rounded-xl
                        ${isClosing
                          ? "bg-gradient-to-br from-signature-blue to-indigo-600 shadow-e2"
                          : "bg-navy/[0.04] ring-1 ring-navy/[0.07]"
                        }
                      `}
                    >
                      <Icon
                        className={`size-5 ${isClosing ? "text-white" : "text-navy/70"}`}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-overline tabular-nums text-muted-foreground/40">
                      {String(i + 1).padStart(2, "0")}
                      <span className="mx-0.5">/</span>
                      {String(allCards.length).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="text-subtitle text-foreground">{card.title}</h3>
                  <p className="mt-2.5 text-body text-muted-foreground">
                    {card.description}
                  </p>
                </article>
              )
            })}
            {/* Trailing spacer ensures WebKit/Safari preserves right padding on scroll */}
            <div className="w-1 shrink-0" aria-hidden="true" />
          </div>

          {/*
            Dots — each button is a 44px-tall hit area with the 5px pill
            centred inside it. Previously the button *was* the 5px pill,
            which is far below the WCAG 2.5.5 minimum target size.
          */}
          <div className="mt-3 flex items-center justify-center">
            {allCards.map((_, i) => {
              const isActive = i === activeIndex
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDotClick(i)}
                  aria-label={`Show ${allCards[i].title}`}
                  aria-current={isActive ? "true" : undefined}
                  className="flex h-11 w-6 items-center justify-center rounded-lg"
                >
                  <span
                    className={`
                      relative block h-[5px] overflow-hidden rounded-full
                      transition-all duration-300 ease-out
                      ${isActive ? "w-8 bg-signature-blue/20" : "w-[5px] bg-border"}
                    `}
                  >
                    {isActive && (
                      <span
                        key={activeIndex}
                        className={`absolute inset-y-0 left-0 rounded-full bg-signature-blue ${autoplayActive ? "" : "w-full"}`}
                        style={
                          autoplayActive
                            ? { animation: `n2p-fill ${AUTOPLAY_MS}ms linear forwards` }
                            : undefined
                        }
                      />
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ════════════════════════════════
            TABLET & DESKTOP — balanced grid
        ════════════════════════════════ */}
        <div className="hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <article
              key={service.title}
              className="surface surface-interactive group relative flex h-full flex-col overflow-hidden p-6 sm:p-7"
            >
              {/* Index marker — quiet structure, visible on hover. */}
              <span className="absolute right-6 top-6 text-overline tabular-nums text-muted-foreground/25 transition-colors duration-300 group-hover:text-signature-blue/40">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-navy/[0.04] ring-1 ring-navy/[0.06] transition-all duration-300 group-hover:bg-signature-blue/10 group-hover:ring-signature-blue/20">
                <service.icon
                  className="size-5 text-navy/70 transition-colors duration-300 group-hover:text-signature-blue"
                  aria-hidden="true"
                />
              </div>

              <h3 className="text-subtitle text-foreground">{service.title}</h3>
              <p className="mt-2.5 text-body text-muted-foreground">
                {service.description}
              </p>

              {/* Baseline rule that draws in from the left on hover. */}
              <div className="mt-auto pt-7">
                <div className="relative h-px w-full bg-border/70">
                  <span className="absolute inset-y-0 left-0 w-0 bg-signature-blue transition-all duration-500 ease-out group-hover:w-12" />
                </div>
              </div>
            </article>
          ))}

          <article className="surface surface-interactive group flex flex-col gap-6 p-6 sm:p-7 sm:flex-row sm:items-center sm:col-span-2 lg:col-span-3">
            <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-signature-blue to-indigo-600 shadow-e2 transition-transform duration-300 group-hover:scale-105">
              <Handshake className="size-5 text-white" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="text-subtitle text-foreground">{closingService.title}</h3>
              <p className="measure mt-1.5 text-body text-muted-foreground">
                {closingService.description}
              </p>
            </div>
          </article>
        </div>

        {/*
          Employer-facing bridge to Hiring Solutions. That page (contract
          staffing, permanent placement, executive search) previously had no
          link anywhere on the homepage — this is the natural spot for it,
          right after the reader has just seen the full services list.

          Design-review finding: as a bare line of caption-sized text on the
          section's plain background, this had nothing to anchor it and read
          as a stray footnote rather than the fix for the audit's #1 nav
          finding. Framed as a pill (the site's existing chip pattern, e.g.
          the "Verified Opportunities" badge on /jobs) so it has the visual
          weight its importance warrants, without competing with the
          section's actual primary CTAs.
        */}
        <div className="mt-9 flex justify-center sm:mt-12 sm:justify-start">
          <Link
            href="/hiring-solutions"
            className="pill group border-primary/20 bg-primary/5 font-semibold text-primary outline-none transition-colors duration-150 hover:border-primary/35 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Looking to hire technology talent? Explore our Hiring Solutions
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </Link>
        </div>

      </div>
    </section>
  )
}