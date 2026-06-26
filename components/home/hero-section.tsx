"use client"

import Link from "next/link"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"

const ROTATING_WORDS = [
  "Consulting",
  "AI Solutions",
  "Cloud Strategy",
  "Digital Growth",
] as const

function RotatingWord() {
  const [wordIndex, setWordIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    let timeout: ReturnType<typeof window.setTimeout> | undefined

    const interval = window.setInterval(() => {
      setIsVisible(false)

      timeout = window.setTimeout(() => {
        setWordIndex((current) => (current + 1) % ROTATING_WORDS.length)
        setIsVisible(true)
      }, 300)
    }, 2800)

    return () => {
      window.clearInterval(interval)
      if (timeout) {
        window.clearTimeout(timeout)
      }
    }
  }, [])

  return (
    <span
      aria-live="polite"
      aria-atomic="true"
      className={`inline-block bg-gradient-to-r from-sky-400/75 via-cyan-300/70 to-blue-400/75 bg-clip-text py-1 font-bold text-transparent transition-all duration-300 ease-out ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
    >
      {ROTATING_WORDS[wordIndex]}
    </span>
  )
}

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-200 group-hover:translate-x-1"
      aria-hidden="true"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

export function HeroSection() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 40)
    return () => clearTimeout(timer)
  }, [])

  const handleScrollDown = useCallback(() => {
    const target =
      document.getElementById("next-section") ??
      document.querySelector<HTMLElement>("main > section:nth-child(2)") ??
      document.querySelector<HTMLElement>("[data-section='services']")

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    } else {
      window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" })
    }
  }, [])

  return (
    <section
      id="hero"
      aria-label="Hero Section"
      aria-describedby="hero-description"
      className="relative flex min-h-0 sm:min-h-screen items-start sm:items-center overflow-hidden bg-[#080e1a] text-slate-100"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Earth background */}
        <div className="absolute inset-0 animate-earth-drift origin-[70%_50%]">
          <Image
            src="/images/hero-earth.jpg"
            alt="Earth orbital view from space"
            fill
            sizes="100vw"
            priority
            className="object-cover object-[55%_35%] sm:object-[72%_50%]"
            style={{
              filter: "brightness(0.88) contrast(0.90) saturate(0.75) hue-rotate(5deg)",
            }}
          />
        </div>

        {/* Directional gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080e1a]/95 via-[#080e1a]/85 sm:via-[#080e1a]/88 md:via-[#080e1a]/76 lg:via-[#080e1a]/60 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#080e1a] via-[#080e1a]/75 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 sm:h-52 bg-gradient-to-t from-[#080e1a] via-[#080e1a]/80 sm:via-[#080e1a]/88 to-transparent" />

        {/* ── Ambient glow removed for professional look ── */}

        {/* Subtle film grain texture */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.015]"
          style={{ mixBlendMode: "overlay" }}
          aria-hidden="true"
        >
          <filter id="hero-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.68"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#hero-grain)" />
        </svg>
      </div>

      <div
        className={`relative z-10 mx-auto w-full max-w-7xl px-5 pt-[82px] pb-10 sm:px-10 sm:py-28 lg:px-16 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
      >
        <div className="max-w-[44rem]">
          <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 sm:gap-2.5 rounded-full border border-slate-700/50 bg-slate-800/55 sm:bg-slate-800/40 ring-1 ring-white/[0.08] sm:ring-0 px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-semibold text-slate-300 backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-blue-400" />
            <span className="uppercase tracking-[0.15em] sm:tracking-[0.2em]">
              Where Innovation Drives Success
            </span>
          </div>

          {/* Heading — unchanged */}
          <h1 className="text-[2.1rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight leading-[1.08] sm:leading-[1.06] text-white/82">
            Innovate.
            <br />
            Integrate.
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent inline-block pb-1">
              Elevate.
            </span>
          </h1>

          <div className="mt-2 sm:mt-5 flex flex-wrap items-center gap-x-2 sm:gap-x-2.5 gap-y-1 text-base sm:text-xl font-medium tracking-wide text-slate-300">
            <span className="text-slate-300">Specializing in</span>
            <RotatingWord />
          </div>

          <p
            id="hero-description"
            className="mt-2 sm:mt-4 max-w-xl text-[14.5px] sm:text-base font-normal leading-relaxed text-slate-300 sm:text-slate-400/90 contrast-more:text-white sm:text-lg"
          >
            We help organizations accelerate digital transformation, modernize
            operations, and create intelligent experiences through consulting,
            AI, cloud, and strategic partnerships.
          </p>

          <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Link
              href="/#services"
              className="group relative inline-flex justify-center items-center gap-3 rounded-[10px] sm:rounded-xl bg-gradient-to-r from-[#1E63B5] to-[#164e93] px-6 py-[11px] sm:px-7 sm:py-4 text-[15px] sm:text-base font-bold text-white shadow-[0_4px_18px_rgba(30,99,181,0.45)] sm:shadow-sm transition-all duration-200 hover:brightness-110 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[#1E63B5] w-full sm:w-auto"
            >
              <span>Explore Services</span>
              <ArrowIcon />
            </Link>

            <Link
              href="/#contact"
              className="inline-flex justify-center items-center gap-2 rounded-[10px] sm:rounded-xl border border-slate-500/50 sm:border-slate-600/50 bg-white/[0.05] sm:bg-white/[0.04] px-6 py-[10px] sm:px-7 sm:py-4 text-[15px] sm:text-base font-semibold text-slate-300 backdrop-blur-md transition-all duration-200 hover:border-sky-400/35 hover:bg-white/[0.07] hover:text-white active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-slate-400 w-full sm:w-auto"
            >
              <span>Contact Us</span>
            </Link>
          </div>

          {/* Mobile-only thin separator before Global Presence */}
          <div className="sm:hidden mt-5 h-px bg-gradient-to-r from-slate-700/70 via-slate-600/30 to-transparent" />

          <div className="mt-4 sm:mt-12 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-medium tracking-wider uppercase text-slate-400/75">
            <div className="flex items-center gap-2 text-slate-400/90 font-semibold">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Global Presence</span>
            </div>

            <span className="text-slate-700 hidden sm:inline">•</span>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-slate-400/80">
              <span className="hover:text-slate-200 transition-colors">Canada</span>
              <span className="text-slate-700">•</span>
              <span className="hover:text-slate-200 transition-colors">United States</span>
              <span className="text-slate-700">•</span>
              <span className="hover:text-slate-200 transition-colors">India</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-20 hidden -translate-x-1/2 md:block">
        <button
          onClick={handleScrollDown}
          className="group flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-lg p-2"
          aria-label="Scroll down to explore"
        >
          <span className="text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase group-hover:text-slate-200 transition-colors">
            Scroll to Explore
          </span>
          <div className="flex h-7 w-4 justify-center rounded-full border-2 border-slate-500/60 p-1 group-hover:border-sky-400 transition-colors">
            <div className="size-1 rounded-full bg-sky-400 animate-bounce" />
          </div>
        </button>
      </div>

      <style jsx global>{`
        @keyframes earthDrift {
          0% {
            transform: scale(1) translate(0px, 0px);
          }
          100% {
            transform: scale(1.05) translate(-15px, -10px);
          }
        }
        .animate-earth-drift {
          animation: earthDrift 60s ease-in-out infinite alternate;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-earth-drift,
          .animate-pulse,
          .animate-bounce {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  )
}