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
    // Respect the OS "reduce motion" setting — hold on the first word.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduceMotion.matches) return

    // window.setTimeout returns a DOM handle (number), not a Node Timeout.
    let timeout: number | undefined

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
    <>
      {/*
        The visible word is decorative motion. It was previously an
        aria-live region, which made screen readers interrupt the user
        to announce a new word every 2.8s. The full list is exposed
        once, statically, and the animation is hidden from AT instead.
      */}
      <span className="sr-only">
        Consulting, AI Solutions, Cloud Strategy, and Digital Growth
      </span>
      <span
        aria-hidden="true"
        className={`inline-block bg-gradient-to-r from-sky-400/85 via-blue-400/80 to-sky-300/85 bg-clip-text py-1 font-bold text-transparent transition-all duration-300 ease-out ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
          }`}
      >
        {ROTATING_WORDS[wordIndex]}
      </span>
    </>
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
        <div className="absolute inset-0">
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
          className="absolute inset-0 w-full h-full opacity-[0.02]"
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

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-[82px] pb-12 sm:px-10 sm:py-28 lg:px-16 animate-fade-in-up">
        <div className="max-w-[46rem]">
          <div className="mb-6 sm:mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/[0.10] bg-white/[0.05] px-3.5 py-1.5 text-overline uppercase text-slate-300 backdrop-blur-md sm:px-4 sm:py-2">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full rounded-full bg-sky-400 opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex size-1.5 rounded-full bg-sky-400" />
            </span>
            <span>Where Innovation Drives Success</span>
          </div>

          <h1 className="text-display text-white">
            Innovate.
            <br />
            Integrate.
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-sky-300 bg-clip-text text-transparent inline-block pb-1">
              Elevate.
            </span>
          </h1>

          <div className="mt-4 sm:mt-6 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-subtitle text-slate-400">
            <span className="font-normal">Specializing in</span>
            <RotatingWord />
          </div>

          <p
            id="hero-description"
            className="mt-5 sm:mt-6 measure text-lead text-slate-400 contrast-more:text-white"
          >
            We help organizations accelerate digital transformation, modernize
            operations, and create intelligent experiences through consulting,
            AI, cloud, and strategic partnerships.
          </p>

          <div className="mt-8 sm:mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/#services"
              className="group relative inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-[#1E63B5] to-[#164e93] px-7 text-[15px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(30,99,181,0.6)] transition-all duration-200 hover:shadow-[0_12px_32px_-6px_rgba(30,99,181,0.75)] hover:brightness-110 active:scale-[0.99] sm:w-auto"
            >
              {/* Sheen sweep on hover — restrained, one pass. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              />
              <span className="relative">Explore Services</span>
              <ArrowIcon />
            </Link>

            <Link
              href="/#contact"
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-white/[0.14] bg-white/[0.04] px-7 text-[15px] font-semibold text-slate-300 backdrop-blur-md transition-all duration-200 hover:border-white/[0.24] hover:bg-white/[0.08] hover:text-white active:scale-[0.99] sm:w-auto"
            >
              <span>Contact Us</span>
            </Link>
          </div>

          <div className="mt-10 sm:mt-14 h-px w-full max-w-md bg-gradient-to-r from-white/[0.14] to-transparent" />

          <div className="mt-5 flex flex-col gap-2.5 text-overline uppercase text-slate-500 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span>Global Presence</span>
            </div>

            <span className="hidden text-slate-700 sm:inline" aria-hidden="true">
              /
            </span>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <span>Canada</span>
              <span className="text-slate-700" aria-hidden="true">/</span>
              <span>United States</span>
              <span className="text-slate-700" aria-hidden="true">/</span>
              <span>India</span>
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

      {/*
        The earth layer used to run a 60s infinite `earthDrift` animation
        (scale 1 -> 1.05 plus a 15px translate). It was removed on purpose.

        Measured on this page at 1440x900: the drift alone held the hero at
        ~38fps versus ~60fps without it, with a style recalculation on every
        single frame. Animating the transform of a full-screen <Image> that
        also carries a CSS filter forces a full-viewport repaint per frame
        rather than a cheap GPU composite, and `will-change: transform` did
        not rescue it. The payoff was a drift most visitors never notice;
        the cost was a pinned CPU core, dropped frames and visible flicker.

        The film-grain <svg> above previously used mix-blend-mode: overlay,
        which was also dropped -- a blend mode has to read back the
        framebuffer, so it forces software compositing even on a GPU. Its
        opacity was nudged 0.015 -> 0.02 to keep the texture reading the
        same without the blend.
      */}
    </section>
  )
}