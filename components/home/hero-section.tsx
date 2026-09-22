"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

function ArrowIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-200 group-hover:translate-x-0.5"
      aria-hidden="true"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

export function HeroSection() {
  const [earthLoaded, setEarthLoaded] = useState(false)

  return (
    <section
      id="hero"
      aria-label="Hero Section"
      aria-describedby="hero-description"
      className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden bg-[#050C16] text-slate-100 pt-[calc(var(--navbar-h)+1.5rem)] pb-12 sm:pb-16"
    >
      {/* ── Environmental Earth Backdrop ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Earth image positioned in right ~55% of the visual field */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-earth.jpg"
            alt="Earth orbital view from space"
            fill
            sizes="100vw"
            priority
            fetchPriority="high"
            onLoad={() => setEarthLoaded(true)}
            className={`object-cover object-[74%_48%] transition-opacity duration-700 ease-out sm:object-[80%_50%] lg:object-[84%_50%] ${
              earthLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* Directional atmospheric gradient: deep space on left, glowing Earth on right */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050C16]/90 via-[#050C16]/65 to-[#050C16] sm:bg-gradient-to-r sm:from-[#050C16] sm:from-20% sm:via-[#050C16]/85 sm:via-50% lg:via-[#050C16]/40 lg:via-60% sm:to-transparent" />
        
        {/* Extra deep atmospheric field behind typography to preserve contrast on ultrawide and curved screens */}
        <div className="absolute inset-y-0 left-0 w-full sm:w-[65%] lg:w-[55%] bg-gradient-to-r from-[#050C16] via-[#050C16]/95 to-transparent" />
        
        {/* Top/bottom edge fades */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#050C16]/90 via-[#050C16]/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-28 sm:h-36 bg-gradient-to-t from-[#050C16] via-[#050C16]/60 to-transparent" />
      </div>

      {/* ── Main Hero Content (Aligned with container-page) ── */}
      <div className="container-page relative z-10">
        <div className="w-full max-w-[39rem] sm:max-w-[43rem] lg:max-w-[46rem]">
          {/* Eyebrow Pre-Heading (Directly Introducing Headline) */}
          <div className="mb-3.5 sm:mb-4 flex items-center gap-2 text-[11.5px] sm:text-[12.5px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            <span className="size-1.5 rounded-full bg-[#3894ea]" aria-hidden="true" />
            <span>Where Innovation Drives Success</span>
          </div>

          {/* Headline (Focal Anchor: fluidly responsive from compact mobile to curved/4K screens) */}
          <h1 className="text-[clamp(2.35rem,1.75rem+3.2vw,5.25rem)] font-extrabold tracking-[-0.038em] leading-[0.98] text-white">
            Innovate.
            <br />
            Integrate.
            <br />
            <span className="text-[#3894ea]">
              Elevate.
            </span>
          </h1>

          {/* Static Capability Bridge */}
          <p className="mt-5 sm:mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[15.5px] sm:text-[17px] text-slate-300">
            <span className="font-normal text-slate-400">Specializing in</span>
            <span className="font-semibold text-slate-100">Technology Solutions &amp; Talent</span>
          </p>

          {/*
            Body Paragraph (Generous 560–580px width).
            Previously named only consulting/AI/cloud, which read as a
            generic IT consultancy — the page's own <title> metadata says
            "Global Technology Recruitment", but nothing in the hero did.
            This names both halves of what N2P does without narrowing the
            company to staffing alone.
          */}
          <p
            id="hero-description"
            className="mt-4 max-w-[560px] lg:max-w-[580px] text-[15.5px] sm:text-[16.5px] leading-[1.7] text-slate-300/90"
          >
            We help organizations accelerate digital transformation and
            modernize operations — pairing technology consulting, AI, and
            cloud delivery with the specialized talent and staffing
            partnerships that bring it to life.
          </p>

          {/* CTA Group */}
          <div className="mt-8 sm:mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3.5">
            <Link
              href="/#services"
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-7 text-[14.5px] font-semibold text-white shadow-[0_4px_16px_-4px_rgba(30,99,181,0.5)] transition-all duration-200 hover:bg-[#164e93] hover:shadow-[0_8px_24px_-4px_rgba(30,99,181,0.65)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] sm:w-auto"
            >
              <span>Explore Services</span>
              <ArrowIcon />
            </Link>

            <Link
              href="/#contact"
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-7 text-[14.5px] font-semibold text-slate-200 transition-all duration-200 hover:border-white/25 hover:bg-white/[0.08] hover:text-white active:scale-[0.99] sm:w-auto"
            >
              <span>Contact Us</span>
            </Link>
          </div>

          {/* Global Presence Strip (Quiet Supporting Metadata) */}
          <div className="mt-9 sm:mt-11 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <span className="size-1 rounded-full bg-emerald-500/80" aria-hidden="true" />
              <span>Global Presence</span>
            </div>

            <span className="text-slate-700" aria-hidden="true">
              /
            </span>

            <div className="flex flex-wrap items-center gap-2 text-slate-500 font-normal">
              <span>Canada</span>
              <span className="text-slate-700" aria-hidden="true">/</span>
              <span>United States</span>
              <span className="text-slate-700" aria-hidden="true">/</span>
              <span>India</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}