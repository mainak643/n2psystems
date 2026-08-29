"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Linkedin, MessageCircle, Mail, Phone, ArrowUpRight, ChevronDown } from "lucide-react"

/*
  Matches the `md:` breakpoint the footer grid uses. Starts as `true` so
  the server render and the first client render agree — the accordion is
  only ever marked inert after we've actually measured the viewport.
*/
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)")
    const sync = () => setIsDesktop(query.matches)
    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])

  return isDesktop
}

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
  const isDesktop = useIsDesktop()
  const panelId = `footer-panel-${id}`

  /*
    The panel collapses to 0fr on mobile but its links stay in the DOM,
    so without this they remain tabbable and screen-reader readable while
    visually hidden. `inert` removes them from the tab order and the
    accessibility tree. Desktop is always expanded, so it is never inert.
  */
  const isCollapsed = !isDesktop && !isOpen

  return (
    <div className="border-t border-on-dark-line md:border-0">
      {/* ── Mobile trigger (hidden on md+) ── */}
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex min-h-11 w-full items-center justify-between py-4 outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-blue-500/40 md:hidden"
      >
        <span className="eyebrow text-on-dark-subtle before:hidden">{label}</span>
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 text-on-dark-faint transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden
        />
      </button>

      {/* ── Desktop label (hidden on mobile) ── */}
      <p className="eyebrow mb-5 hidden text-on-dark-subtle before:hidden md:flex">{label}</p>

      {/* ── Animated container — grid trick for smooth open/close ── */}
      {/* On desktop: always open. On mobile: toggled. */}
      <div
        id={panelId}
        inert={isCollapsed}
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
    <footer className="on-dark relative overflow-hidden border-t border-on-dark-line bg-surface-dark">
      {/* ── Soothing navy ambient glow ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30, 99, 181, 0.18) 0%, rgba(11, 29, 54, 0) 75%)",
        }}
      />

      {/* ── Top edge accent line for smooth visual transition ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/30 to-transparent"
      />

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
      <div className="container-page relative">

        {/*
          Desktop: 4-col grid with gap, top/bottom padding
          Mobile: no gap (borders serve as dividers), accordion sections handle own spacing
        */}
        <div className="grid gap-0 pt-10 pb-0 sm:gap-8 sm:pt-12 md:gap-8 md:grid-cols-2 md:pt-16 md:pb-10 lg:grid-cols-4">

          {/* ── Brand column ── */}
          {/* Mobile: bottom border + extra bottom padding acts as visual separator */}
          <div className="border-b border-on-dark-line pb-8 md:col-span-2 md:border-0 md:pb-0 lg:col-span-1 lg:pr-6">
            <Link
              href="/"
              className="group inline-flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              aria-label="N2P Systems — Home"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-on-dark-line-strong bg-gradient-to-br from-primary/20 to-cyan-support/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-300 group-hover:border-blue-400/30"
              >
                <Image
                  src="/images/n2p-logo-light.png"
                  alt="N2P Systems"
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-subtitle text-on-dark">
                N2P <span className="font-normal text-on-dark-muted">Systems</span>
              </span>
            </Link>

            <p className="mt-5 max-w-[240px] text-caption leading-[1.85] text-on-dark-muted">
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
                  className="group/s flex h-10 w-10 items-center justify-center rounded-lg border border-on-dark-line-strong bg-on-dark-fill text-on-dark-subtle outline-none transition-all duration-200 hover:border-blue-400/35 hover:bg-blue-500/[0.08] hover:text-on-dark focus-visible:ring-2 focus-visible:ring-blue-500/40 md:h-9 md:w-9"
                >
                  <Icon className="h-[15px] w-[15px]" aria-hidden="true" />
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
                    className="group flex items-center gap-2 py-2.5 text-caption text-on-dark-muted outline-none transition-all duration-150 hover:text-on-dark focus-visible:text-on-dark md:py-0 md:mb-3"
                  >
                    <span className="inline-block h-px w-0 shrink-0 bg-gradient-to-r from-sky-400/80 to-blue-400/50 transition-all duration-200 group-hover:w-3" />
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
                    className="group flex items-center gap-2 py-2.5 text-caption text-on-dark-muted outline-none transition-all duration-150 hover:text-on-dark focus-visible:text-on-dark md:py-0 md:mb-3"
                  >
                    <span className="inline-block h-px w-0 shrink-0 bg-gradient-to-r from-sky-400/80 to-blue-400/50 transition-all duration-200 group-hover:w-3" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Quick CTA — full-width on mobile, auto on desktop */}
            <div className="mt-5 md:mt-8">
              <Link
                href="/resume"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-lg border border-on-dark-line-strong bg-on-dark-fill px-4 py-3 text-xs font-semibold text-on-dark-subtle outline-none transition-all duration-200 hover:text-on-dark focus-visible:ring-2 focus-visible:ring-blue-400/40 md:w-auto md:justify-start md:py-2.5"
              >
                Submit Your Resume
                <ArrowUpRight className="h-3 w-3 text-on-dark-subtle transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-on-dark-muted" aria-hidden="true" />
              </Link>
            </div>
          </AccordionSection>

          {/* ── Contact — accordion on mobile ── */}
          <AccordionSection id="contact" label="Contact" openSection={openSection} onToggle={toggleSection}>
            <ul className="space-y-3.5">
              <li>
                <a
                  href="mailto:info@n2psystems.ca"
                  className="group flex items-center gap-2.5 text-caption text-on-dark-muted outline-none transition-colors duration-150 hover:text-on-dark focus-visible:text-on-dark"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-on-dark-line bg-on-dark-fill transition-all duration-200 group-hover:border-blue-400/30 group-hover:bg-blue-500/[0.08]">
                    <Mail className="h-[13px] w-[13px] text-sky-300/80" aria-hidden="true" />
                  </span>
                  info@n2psystems.ca
                </a>
              </li>
              <li>
                <div className="flex items-start gap-2.5">
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-on-dark-line bg-on-dark-fill">
                    <Phone className="h-[13px] w-[13px] text-sky-300/80" aria-hidden="true" />
                  </span>
                  <div className="flex flex-col gap-3">
                    <a
                      href="tel:+14373359390"
                      className="group flex flex-col outline-none transition-colors duration-150 focus-visible:text-on-dark"
                    >
                      <span className="text-overline uppercase text-on-dark-subtle transition-colors group-hover:text-on-dark-muted">
                        Canada & USA
                      </span>
                      <span className="text-caption text-on-dark-muted transition-colors group-hover:text-on-dark">
                        +1 (437) 335-9390
                      </span>
                    </a>
                    <a
                      href="tel:+919776047567"
                      className="group flex flex-col outline-none transition-colors duration-150 focus-visible:text-on-dark"
                    >
                      <span className="text-overline uppercase text-on-dark-subtle transition-colors group-hover:text-on-dark-muted">
                        India
                      </span>
                      <span className="text-caption text-on-dark-muted transition-colors group-hover:text-on-dark">
                        +91 97760 47567
                      </span>
                    </a>
                  </div>
                </div>
              </li>
            </ul>

            {/* Regions */}
            <div className="mt-7">
              <p className="eyebrow mb-3.5 text-on-dark-subtle before:hidden">Serving clients in</p>
              <div className="flex flex-wrap items-center gap-2">
                {regions.map(({ flag, name }) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 rounded-md border border-on-dark-line bg-on-dark-fill px-2.5 py-1.5 text-xs text-on-dark-muted"
                  >
                    <span className="text-xs leading-none" aria-hidden="true">{flag}</span>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </AccordionSection>
        </div>

        {/* ── Divider ── */}
        <div aria-hidden="true" className="hairline mt-8 md:mt-0" />

        {/* ── Bottom bar ── */}
        <div className="flex flex-col gap-3 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:flex-row md:items-center md:justify-between md:pb-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-caption text-on-dark-subtle">
              © 2026 N2P Systems. All rights reserved.
            </span>
            <span className="hidden h-3 w-px bg-on-dark-line-strong md:inline-block" aria-hidden="true" />
            <span className="hidden text-caption italic tracking-wide text-on-dark-faint md:inline">
              Innovate. Integrate. Elevate.
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/privacy-policy"
              className="text-caption text-on-dark-subtle outline-none transition-colors hover:text-on-dark-muted"
            >
              Privacy Policy
            </Link>
            <span className="h-3 w-px bg-on-dark-line" aria-hidden="true" />
            <Link
              href="/terms-of-service"
              className="text-caption text-on-dark-subtle outline-none transition-colors hover:text-on-dark-muted"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}