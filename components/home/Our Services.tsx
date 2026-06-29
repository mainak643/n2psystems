"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import {
  Lightbulb,
  ClipboardCheck,
  Sparkles,
  BrainCircuit,
  ServerCog,
  BookOpenCheck,
  Handshake,
  ArrowRight,
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isInteractedRef = useRef(false)
  const [isInteractedUI, setIsInteractedUI] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  /* ── scroll to a card by index ── */
  const goTo = useCallback((index: number) => {
    const el = scrollRef.current
    if (!el) return
    const cards = el.querySelectorAll<HTMLElement>("article")
    const target = cards[index]
    if (!target) return
    const left = target.offsetLeft - (el.clientWidth - target.offsetWidth) / 2
    el.scrollTo({ left, behavior: "smooth" })
    setActiveIndex(index)
  }, [])

  /* ── start (or restart) the autoplay interval ── */
  const startTimer = useCallback(() => {
    if (isInteractedRef.current) return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % allCards.length
        goTo(next)
        return next
      })
    }, AUTOPLAY_MS)
  }, [goTo])

  /* ── stop the interval (no boolean flag — just kill it) ── */
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  /* ── boot on mount ── */
  useEffect(() => {
    startTimer()
    return stopTimer
  }, [startTimer, stopTimer])

  /* ── recover if tab goes background then comes back ── */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") startTimer()
      else stopTimer()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [startTimer, stopTimer])

  /* ── sync dot while user manually swipes ── */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const ratio = el.scrollLeft / (el.scrollWidth - el.clientWidth)
    setActiveIndex(Math.round(ratio * (allCards.length - 1)))
  }, [])

  /* ── permanently stop on user interaction ── */
  const handleInteraction = useCallback(() => {
    isInteractedRef.current = true
    setIsInteractedUI(true)
    stopTimer()
  }, [stopTimer])

  /* ── dot click: jump + stop timer permanently ── */
  const handleDotClick = (index: number) => {
    handleInteraction()
    goTo(index)
  }

  return (
    <section
      id="services"
      className="relative scroll-mt-24 overflow-hidden bg-frost pb-10 pt-12 sm:pb-16 sm:pt-24 lg:pb-20 lg:pt-32"
    >
      <style>{`
        @keyframes n2p-fill {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>

      <div className="absolute inset-0 opacity-30">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-signature-blue/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-tech-green/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <div className="mb-7 sm:mb-16 max-w-3xl">
          <p className="mb-2 sm:mb-3 text-sm font-bold uppercase tracking-[0.24em] text-signature-blue">
            Our Services
          </p>
          <h2 className="text-balance font-sans text-2xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Technology Solutions Built for Modern Business
          </h2>
          <p className="hidden sm:block mt-4 max-w-2xl text-pretty font-serif text-base leading-relaxed text-muted-foreground sm:text-lg">
            From consulting and digital transformation to AI integration and cloud
            infrastructure, we help organizations modernize operations, improve
            efficiency, and accelerate business growth.
          </p>
        </div>

        {/* ════════════════════════════════
            MOBILE — auto-scroll carousel
        ════════════════════════════════ */}
        <div className="sm:hidden">
          <div className="mb-3 flex items-center justify-end gap-1.5 text-muted-foreground/70 pr-2">
            <span className="text-[10px] font-semibold tracking-wider uppercase">Swipe to explore</span>
            <ArrowRight className="size-3 animate-pulse" />
          </div>
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            onTouchStart={handleInteraction}
            onPointerDown={handleInteraction}
            className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth gap-3 -mx-5 px-5 pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {allCards.map((card, i) => {
              const isClosing = "isClosing" in card && card.isClosing
              const Icon = card.icon
              const isActive = i === activeIndex

              return (
                <article
                  key={card.title}
                  className={`
                    flex-shrink-0 w-[82vw] snap-center flex flex-col
                    rounded-2xl border bg-card p-5 shadow-sm
                    transition-all duration-300
                    ${isActive
                      ? "border-signature-blue/30 shadow-md scale-[1.01]"
                      : "border-border opacity-75 scale-[0.98]"
                    }
                  `}
                >
                  <div
                    className={`mb-4 flex size-11 items-center justify-center rounded-xl shadow-sm
                      ${isClosing
                        ? "bg-gradient-to-br from-signature-blue to-indigo-600"
                        : "bg-navy/[0.05] ring-1 ring-navy/[0.08]"
                      }
                    `}
                  >
                    <Icon className={`size-5 ${isClosing ? "text-white" : "text-navy/70"}`} />
                  </div>

                  <span className="mb-2 text-xs font-semibold tabular-nums text-muted-foreground/40">
                    {String(i + 1).padStart(2, "0")} / {String(allCards.length).padStart(2, "0")}
                  </span>

                  <h3 className="font-sans text-[17px] font-bold leading-snug text-foreground">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {card.description}
                  </p>
                </article>
              )
            })}
          </div>

          {/* Dots */}
          <div className="mt-5 flex items-center justify-center gap-2">
            {allCards.map((_, i) => {
              const isActive = i === activeIndex
              return (
                <button
                  key={i}
                  onClick={() => handleDotClick(i)}
                  aria-label={`Go to ${allCards[i].title}`}
                  className={`
                    relative h-[5px] rounded-full overflow-hidden
                    transition-all duration-300 ease-out
                    ${isActive ? "w-8 bg-signature-blue/20" : "w-[5px] bg-border"}
                  `}
                >
                  {isActive && (
                    <span
                      key={activeIndex}
                      className={`absolute inset-y-0 left-0 rounded-full bg-signature-blue ${isInteractedUI ? 'w-full' : ''}`}
                      style={!isInteractedUI ? { animation: `n2p-fill ${AUTOPLAY_MS}ms linear forwards` } : undefined}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ════════════════════════════════
            DESKTOP — original grid
        ════════════════════════════════ */}
        <div className="hidden sm:grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.title}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-signature-blue/15 hover:shadow-lg"
            >
              <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-navy/[0.04] ring-1 ring-navy/[0.06] transition-all duration-300 group-hover:bg-signature-blue/10 group-hover:ring-signature-blue/15">
                <service.icon className="size-5 text-navy/70 transition-colors duration-300 group-hover:text-signature-blue" />
              </div>
              <h3 className="font-sans text-lg font-semibold text-foreground">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
              <div className="mt-auto pt-6">
                <div className="h-px w-full bg-border/70 transition-colors duration-300 group-hover:bg-signature-blue/10" />
              </div>
            </article>
          ))}

          <article className="group flex flex-col gap-5 rounded-2xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-signature-blue/15 hover:shadow-lg sm:flex-row sm:items-center md:col-span-2 lg:col-span-3">
            <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-signature-blue to-indigo-600 shadow-sm transition-transform duration-300 group-hover:scale-105">
              <Handshake className="size-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-sans text-lg font-semibold text-foreground">{closingService.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:max-w-2xl">{closingService.description}</p>
            </div>
          </article>
        </div>

      </div>
    </section>
  )
}