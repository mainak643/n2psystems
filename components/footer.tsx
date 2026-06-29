"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Linkedin, MessageCircle, Mail, Phone, ArrowUpRight, ChevronDown } from "lucide-react"

const companyLinks = [
  { name: "Our Services", href: "/#services" },
  { name: "About Us", href: "/#about" },
  { name: "Contact Us", href: "/#contact" },
  { name: "Partner With Us", href: "/clients" },
]

const careerLinks = [
  { name: "Browse Opportunities", href: "/jobs" },
  { name: "Submit Profile", href: "/resume" },
]

const regions = [
  { flag: "🇨🇦", name: "Canada" },
  { flag: "🇺🇸", name: "United States" },
  { flag: "🇮🇳", name: "India" },
]

const socialLinks = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/n2p-systems/",
    icon: Linkedin,
    label: "Connect on LinkedIn",
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/919776047567",
    icon: MessageCircle,
    label: "Chat on WhatsApp",
  },
]

// Reusable mobile accordion section wrapper
function AccordionSection({
  id,
  label,
  openSection,
  onToggle,
  children,
}: {
  id: string
  label: string
  openSection: string | null
  onToggle: (id: string) => void
  children: React.ReactNode
}) {
  const isOpen = openSection === id

  return (
    <div className="border-t border-white/[0.06] md:border-0">
      {/* ── Mobile trigger (hidden on md+) ── */}
      <button
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between py-4 outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-blue-500/40 md:hidden"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
          {label}
        </span>
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 text-white/30 transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden
        />
      </button>

      {/* ── Desktop label (hidden on mobile) ── */}
      <p className="mb-5 hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45 md:block">
        {label}
      </p>

      {/* ── Animated container — grid trick for smooth open/close ── */}
      {/* On desktop: always open. On mobile: toggled. */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out md:grid-rows-[1fr]"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden md:overflow-visible">
          <div className="pb-5 md:pb-0">{children}</div>
        </div>
      </div>
    </div>
  )
}

export function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null)

  const toggleSection = (id: string) =>
    setOpenSection((prev) => (prev === id ? null : id))

  return (
    <footer
      className="relative overflow-hidden border-t border-white/[0.08]"
      style={{ background: "#07101f" }}
    >
      {/* ── Background grid — very faint ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 0%, black 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 0%, black 20%, transparent 80%)",
        }}
      />

      {/* ── Content ── */}
      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10">

        {/*
          Desktop: 4-col grid with gap, top/bottom padding
          Mobile: no gap (borders serve as dividers), accordion sections handle own spacing
        */}
        <div className="grid gap-0 pt-10 pb-0 sm:gap-8 sm:pt-12 md:gap-8 md:grid-cols-2 md:pt-16 md:pb-10 lg:grid-cols-4">

          {/* ── Brand column ── */}
          {/* Mobile: bottom border + extra bottom padding acts as visual separator */}
          <div className="border-b border-white/[0.06] pb-8 md:col-span-2 md:border-0 md:pb-0 lg:col-span-1 lg:pr-6">
            <Link
              href="/"
              className="group inline-flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              aria-label="N2P Systems — Home"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.14] transition-all duration-300 group-hover:border-blue-400/30"
                style={{
                  background: "linear-gradient(135deg, rgba(29,111,219,0.2) 0%, rgba(6,182,212,0.08) 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.3)",
                }}
              >
                <Image
                  src="/images/n2p-logo-light.png"
                  alt="N2P Systems"
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-white">
                N2P <span className="font-normal text-white/60">Systems</span>
              </span>
            </Link>

            <p className="mt-5 max-w-[240px] text-[13px] leading-[1.85] text-white/60">
              Technology partner for AI adoption, cloud transformation, and enterprise growth.
            </p>

            {/* Social */}
            <div className="mt-7 flex items-center gap-2.5">
              {socialLinks.map(({ name, href, icon: Icon, label }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  /* Slightly larger tap target on mobile */
                  className="group/s flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.14] bg-white/[0.04] text-white/55 outline-none transition-all duration-200 hover:border-blue-400/35 hover:bg-blue-500/[0.08] hover:text-white/90 focus-visible:ring-2 focus-visible:ring-blue-500/40 md:h-9 md:w-9"
                >
                  <Icon className="h-[15px] w-[15px]" />
                </a>
              ))}
            </div>
          </div>

          {/* ── Company — accordion on mobile ── */}
          <AccordionSection id="company" label="Company" openSection={openSection} onToggle={toggleSection}>
            <ul className="space-y-0.5">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    /* Taller touch target on mobile, tighter on desktop */
                    className="group flex items-center gap-2 py-2.5 text-[13.5px] text-white/70 outline-none transition-all duration-150 hover:text-white focus-visible:text-white md:py-0 md:mb-3"
                  >
                    <span
                      className="inline-block h-px w-0 shrink-0 transition-all duration-200 group-hover:w-3"
                      style={{ background: "linear-gradient(to right, rgba(56,189,248,0.8), rgba(96,165,250,0.5))" }}
                    />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionSection>

          {/* ── Careers — accordion on mobile ── */}
          <AccordionSection id="careers" label="Careers" openSection={openSection} onToggle={toggleSection}>
            <ul className="space-y-0.5">
              {careerLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 py-2.5 text-[13.5px] text-white/70 outline-none transition-all duration-150 hover:text-white focus-visible:text-white md:py-0 md:mb-3"
                  >
                    <span
                      className="inline-block h-px w-0 shrink-0 transition-all duration-200 group-hover:w-3"
                      style={{ background: "linear-gradient(to right, rgba(56,189,248,0.8), rgba(96,165,250,0.5))" }}
                    />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Quick CTA — full-width on mobile, auto on desktop */}
            <div className="mt-5 md:mt-8">
              <Link
                href="/resume"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[12px] font-semibold text-white/80 outline-none transition-all duration-200 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400/40 md:w-auto md:justify-start md:py-2.5"
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                Submit Your Resume
                <ArrowUpRight className="h-3 w-3 text-white/45 transition-all duration-200 group-hover:text-white/75 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </AccordionSection>

          {/* ── Contact — accordion on mobile ── */}
          <AccordionSection id="contact" label="Contact" openSection={openSection} onToggle={toggleSection}>
            <ul className="space-y-3.5">
              <li>
                <a
                  href="mailto:info@n2psystems.com"
                  className="group flex items-center gap-2.5 text-[13.5px] text-white/70 outline-none transition-colors duration-150 hover:text-white focus-visible:text-white"
                >
                  <span
                    className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-lg border transition-all duration-200 group-hover:border-blue-400/30 group-hover:bg-blue-500/[0.08]"
                    style={{
                      borderColor: "rgba(255,255,255,0.09)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <Mail className="h-[13px] w-[13px] text-blue-300/80" aria-hidden />
                  </span>
                  info@n2psystems.com
                </a>
              </li>
              <li>
                <div className="flex items-start gap-2.5">
                  <span
                    className="mt-1 flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-lg border"
                    style={{
                      borderColor: "rgba(255,255,255,0.09)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <Phone className="h-[13px] w-[13px] text-blue-300/80" aria-hidden />
                  </span>
                  <div className="flex flex-col gap-3">
                    <a
                      href="tel:+14373359390"
                      className="group flex flex-col outline-none transition-colors duration-150 focus-visible:text-white"
                    >
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/45 transition-colors group-hover:text-white/65">
                        Canada & USA
                      </span>
                      <span className="text-[13.5px] text-white/70 transition-colors group-hover:text-white">
                        +1 (437) 335-9390
                      </span>
                    </a>
                    <a
                      href="tel:+919776047567"
                      className="group flex flex-col outline-none transition-colors duration-150 focus-visible:text-white"
                    >
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/45 transition-colors group-hover:text-white/65">
                        India
                      </span>
                      <span className="text-[13.5px] text-white/70 transition-colors group-hover:text-white">
                        +91 97760 47567
                      </span>
                    </a>
                  </div>
                </div>
              </li>
            </ul>

            {/* Regions */}
            <div className="mt-7">
              <p className="mb-3.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                Serving clients in
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {regions.map(({ flag, name }) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-white/60"
                    style={{
                      border: "1px solid rgba(255,255,255,0.09)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <span className="text-[12px] leading-none" aria-hidden>{flag}</span>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </AccordionSection>
        </div>

        {/* ── Divider ── */}
        <div
          aria-hidden
          className="mt-8 h-px md:mt-0"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 15%, rgba(255,255,255,0.08) 85%, transparent 100%)",
          }}
        />

        {/* ── Bottom bar ── */}
        <div className="flex flex-col gap-3 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[11px] text-white/45">
              © 2026 N2P Systems. All rights reserved.
            </span>
            <span className="hidden h-3 w-px md:inline-block" style={{ background: "rgba(255,255,255,0.12)" }} />
            <span className="hidden text-[11px] text-white/28 md:inline" style={{ fontStyle: "italic", letterSpacing: "0.03em" }}>
              Innovate. Integrate. Elevate.
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/privacy-policy"
              className="text-[11px] text-white/45 outline-none transition-colors hover:text-white/70"
            >
              Privacy Policy
            </Link>
            <span className="h-3 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <Link
              href="/terms-of-service"
              className="text-[11px] text-white/45 outline-none transition-colors hover:text-white/70"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}