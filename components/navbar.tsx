"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect

// ─── Types ───────────────────────────────────────────────────────────────────

type NavChild = {
  name: string
  href: string
  description?: string
}

type NavAnchorItem = {
  name: string
  anchor: string
  href?: never
  children?: never
}

type NavLinkItem = {
  name: string
  href: string
  anchor?: never
  children?: never
}

type NavDropdownItem = {
  name: string
  children: NavChild[]
  href?: never
  anchor?: never
}

type NavItem = NavAnchorItem | NavLinkItem | NavDropdownItem

// ─── Navigation config ───────────────────────────────────────────────────────

const navigation: NavItem[] = [
  { name: "Our Services", anchor: "services" },
  // The one page that actually explains N2P's staffing/hiring model to
  // employers — previously reachable only by direct URL or search, since it
  // had no link anywhere in the nav, homepage, or footer.
  { name: "Hiring Solutions", href: "/hiring-solutions" },
  {
    name: "Careers",
    children: [
      {
        name: "Browse Opportunities",
        href: "/jobs",
        description: "Explore open roles",
      },
      {
        name: "Submit Profile",
        href: "/resume",
        description: "Choose the right application path",
      },
    ],
  },
  { name: "About Us", anchor: "about" },
  {
    name: "Contact",
    children: [
      {
        name: "Contact Us",
        href: "/#contact",
        description: "Reach our team directly",
      },
      {
        name: "Partner With Us",
        href: "/clients",
        description: "Explore collaboration",
      },
    ],
  },
]

// ─── Anchor scroll hook ───────────────────────────────────────────────────────

function useAnchorNav() {
  const pathname = usePathname()
  const router = useRouter()
  return useCallback(
    (anchor: string, onDone?: () => void) => {
      if (pathname === "/") {
        const el = document.getElementById(anchor)
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
      } else {
        router.push(`/#${anchor}`)
      }
      onDone?.()
    },
    [pathname, router],
  )
}

// ─── Desktop Dropdown ─────────────────────────────────────────────────────────

function DesktopDropdown({
  item,
  isOpen,
  onEnter,
  onLeave,
}: {
  item: NavDropdownItem
  isOpen: boolean
  onEnter: () => void
  onLeave: () => void
}) {
  const pathname = usePathname()
  const isChildActive = item.children.some((c) => pathname === c.href)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const isHighlighted = isOpen || isChildActive

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      isOpen ? onLeave() : onEnter()
    }
    if (e.key === "Escape" && isOpen) {
      onLeave()
      triggerRef.current?.focus()
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      onEnter()
      requestAnimationFrame(() => {
        const first = menuRef.current?.querySelector<HTMLAnchorElement>(
          "[role='menuitem']",
        )
        first?.focus()
      })
    }
  }

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLAnchorElement>(
        "[role='menuitem']",
      ) ?? [],
    )
    const idx = items.indexOf(document.activeElement as HTMLAnchorElement)

    if (e.key === "ArrowDown") {
      e.preventDefault()
      items[(idx + 1) % items.length]?.focus()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (idx <= 0) {
        onLeave()
        triggerRef.current?.focus()
      } else {
        items[idx - 1]?.focus()
      }
    } else if (e.key === "Escape") {
      onLeave()
      triggerRef.current?.focus()
    } else if (e.key === "Tab") {
      onLeave()
    }
  }

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button
        ref={triggerRef}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "group flex items-center gap-1.5 rounded-md py-2 text-[14px] xl:text-[15.5px] font-medium transition-colors duration-200 outline-none",
          "focus-visible:text-white focus-visible:ring-2 focus-visible:ring-sky-400/50",
          isHighlighted ? "text-white" : "text-white/80 hover:text-white",
        )}
      >
        <span className="relative">
          {item.name}
          {/* Active / open underline */}
          <span
            className="absolute -bottom-0.5 left-0 h-px bg-sky-400 transition-all duration-300"
            style={{ width: isHighlighted ? "100%" : "0%" }}
          />
          {/* Hover underline — only when not already active */}
          {!isHighlighted && (
            <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-sky-400 transition-all duration-300 group-hover:w-full" />
          )}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-200",
            isOpen ? "rotate-180 text-sky-400" : "opacity-50",
          )}
        />
      </button>

      <div
        ref={menuRef}
        role="menu"
        aria-label={item.name}
        onKeyDown={handleMenuKeyDown}
        className={cn(
          "absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 transition-all duration-200 origin-top",
          isOpen
            ? "pointer-events-auto translate-y-0 scale-y-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-y-95 opacity-0",
        )}
        style={{ minWidth: 240 }}
      >
        {/* Invisible gap bridge so hover doesn't drop between trigger and menu */}
        <div className="absolute -top-3 left-0 right-0 h-3" aria-hidden="true" />

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface-dark)] shadow-[0_16px_50px_var(--on-dark-shadow)]">
          <div className="h-px bg-gradient-to-r from-blue-500/50 via-sky-400/40 to-transparent" />
          <div className="p-2">
            {item.children.map((child) => {
              const isActive = pathname === child.href
              return (
                <Link
                  key={child.name}
                  href={child.href}
                  role="menuitem"
                  tabIndex={isOpen ? 0 : -1}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group/item flex items-start gap-3 rounded-xl px-4 py-3 transition-colors duration-150 outline-none",
                    isActive
                      ? "bg-white/[0.07] text-white"
                      : "text-white/70 hover:bg-white/[0.05] hover:text-white",
                    "focus-visible:bg-white/[0.05] focus-visible:text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400/40",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium leading-none">
                      {child.name}
                      {isActive && (
                        <span className="inline-block h-1 w-1 rounded-full bg-sky-400" />
                      )}
                    </div>
                    {child.description && (
                      <div className="mt-1.5 text-xs leading-snug text-white/40">
                        {child.description}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="mt-0.5 size-3.5 shrink-0 opacity-0 -translate-x-1 transition-all duration-200 group-hover/item:translate-x-0 group-hover/item:opacity-40" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Mobile menu animations (injected once, avoids Tailwind purge issues) ────

const MOBILE_STYLES = `
  .mob-backdrop {
    opacity: 0;
    transition: opacity 0.35s ease;
  }
  .mob-backdrop.vis { opacity: 1; }

  .mob-drawer {
    transform: translateX(100%);
    opacity: 0;
    will-change: transform, opacity;
    transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease;
  }
  .mob-drawer.vis {
    transform: translateX(0);
    opacity: 1;
  }

  .nav-row {
    opacity: 0;
    transform: translateX(14px);
    transition: opacity 0.32s ease, transform 0.32s ease;
  }
  .nav-row.vis {
    opacity: 1;
    transform: translateX(0);
  }

  .child-grid {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    transition: grid-template-rows 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s ease;
  }
  .child-grid.open {
    grid-template-rows: 1fr;
    opacity: 1;
  }
  .child-grid > div { overflow: hidden; }

  .mob-ctas {
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.35s ease 0.22s, transform 0.35s ease 0.22s;
  }
  .mob-ctas.vis {
    opacity: 1;
    transform: translateY(0);
  }

  @media (prefers-reduced-motion: reduce) {
    .mob-backdrop, .mob-drawer, .nav-row, .child-grid, .mob-ctas {
      transition: none !important;
      animation: none !important;
    }
  }
`

// ─── Mobile Menu ─────────────────────────────────────────────────────────────

function MobileMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()
  const scrollTo = useAnchorNav()

  // Close on route change
  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Mount / unmount with animation
  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      const t = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(t)
    }
    setVisible(false)
    const t = setTimeout(() => {
      setMounted(false)
      setExpandedSection(null)
    }, 420)
    return () => clearTimeout(t)
  }, [isOpen])

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  if (!mounted) return null

  return (
    <>
      <style suppressHydrationWarning>{MOBILE_STYLES}</style>

      {/* Backdrop */}
      <div
        className={cn(
          "mob-backdrop fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden",
          visible && "vis",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        id="mobile-nav-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          "mob-drawer fixed right-0 top-0 bottom-0 z-50 flex w-[min(85vw,360px)] flex-col lg:hidden",
          visible && "vis",
        )}
        style={{
          background: "var(--surface-dark)",
          borderLeft: "1px solid var(--nav-line)",
          boxShadow: "-12px 0 40px var(--on-dark-shadow)",
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          aria-hidden="true"
          style={{ background: "var(--nav-drawer-accent-line)" }}
        />

        {/* Header */}
        <div
          className="relative flex shrink-0 items-center justify-between"
          style={{ padding: "20px 24px 18px", borderBottom: "1px solid var(--on-dark-fill)" }}
        >
          <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.08] bg-white/5">
              <Image
                src="/images/n2p-logo-light.png"
                alt="N2P Systems"
                width={34}
                height={34}
                className="h-full w-full object-contain"
              />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--nav-wordmark)", letterSpacing: "-0.01em" }}>
              N2P{" "}
              <span style={{ color: "var(--nav-wordmark-muted)", fontWeight: 400 }}>Systems</span>
            </span>
          </Link>

          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.06] outline-none transition-all duration-200 hover:bg-white/15 active:scale-95 focus-visible:ring-2 focus-visible:ring-sky-400/50"
          >
            <X className="size-4 text-white/80" />
          </button>
        </div>

        {/* Nav rows */}
        <nav
          className="flex-1 overflow-y-auto"
          style={{ padding: "8px 0 12px", scrollbarWidth: "none" }}
          aria-label="Mobile navigation"
        >
          {navigation.map((item, i) => {
            const hasChildren = "children" in item && Boolean(item.children)
            const isExpanded = hasChildren && expandedSection === item.name
            const isChildActive = hasChildren && Boolean(item.children?.some((c) => pathname === c.href))
            const isAnchor = "anchor" in item && !hasChildren && Boolean(item.anchor)
            const isLink = "href" in item && !hasChildren && Boolean(item.href)
            const isActive = isLink && pathname === (item as NavLinkItem).href

            return (
              <div
                key={item.name}
                className={cn("nav-row", visible && "vis")}
                style={{ transitionDelay: visible ? `${45 + i * 45}ms` : "0ms" }}
              >
                {hasChildren && item.children ? (
                  <div>
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : item.name)}
                      aria-expanded={isExpanded}
                      aria-controls={`mob-submenu-${item.name.replace(/\s+/g, "-").toLowerCase()}`}
                      className="flex w-full items-center text-left outline-none transition-colors duration-150 hover:bg-white/[0.03] focus-visible:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400/40"
                      style={{ padding: "14px 24px" }}
                    >
                      <div
                        style={{
                          width: 2, height: 16, borderRadius: 1, marginRight: 14, flexShrink: 0,
                          background: isExpanded || isChildActive
                            ? "var(--nav-indicator-active)"
                            : "var(--nav-indicator-idle)",
                          transition: "background 0.2s",
                        }}
                      />
                      <span
                        style={{
                          flex: 1, fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em",
                          color: isExpanded || isChildActive ? "var(--nav-label-active)" : "var(--nav-label-idle)",
                          transition: "color 0.2s",
                        }}
                      >
                        {item.name}
                      </span>
                      <ChevronRight
                        style={{
                          width: 14, height: 14,
                          color: isExpanded || isChildActive ? "var(--nav-chevron-active)" : "var(--nav-chevron-idle)",
                          transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                          transition: "transform 0.25s ease, color 0.2s",
                        }}
                      />
                    </button>

                    <div
                      id={`mob-submenu-${item.name.replace(/\s+/g, "-").toLowerCase()}`}
                      className={cn("child-grid", isExpanded && "open")}
                    >
                      <div>
                        <div style={{ padding: "2px 0 8px" }}>
                          {item.children.map((child) => {
                            const isChildCurrent = pathname === child.href
                            return (
                              <Link
                                key={child.name}
                                href={child.href}
                                onClick={onClose}
                                aria-current={isChildCurrent ? "page" : undefined}
                                className="flex items-center outline-none transition-colors duration-150 hover:bg-white/[0.03] focus-visible:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400/40"
                                style={{
                                  padding: "10px 24px 10px 40px",
                                  background: isChildCurrent ? "var(--nav-accent-soft)" : undefined,
                                }}
                              >
                                <div className="flex-1 min-w-0">
                                  <div
                                    style={{
                                      fontSize: 13, fontWeight: 500,
                                      color: isChildCurrent ? "var(--nav-accent-strong)" : "var(--nav-label-faint)",
                                    }}
                                  >
                                    {child.name}
                                  </div>
                                  {child.description && (
                                    <div style={{ marginTop: 2, fontSize: 11, color: "var(--nav-label-caption)", letterSpacing: "0.01em" }}>
                                      {child.description}
                                    </div>
                                  )}
                                </div>
                                {isChildCurrent && (
                                  <span style={{ display: "inline-block", width: 4, height: 4, borderRadius: "50%", background: "var(--nav-accent-bright)", flexShrink: 0 }} />
                                )}
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isAnchor && (item as NavAnchorItem).anchor ? (
                  <button
                    onClick={() => scrollTo((item as NavAnchorItem).anchor, onClose)}
                    className="flex w-full items-center text-left outline-none transition-colors duration-150 hover:bg-white/[0.02] focus-visible:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400/40"
                    style={{ padding: "14px 24px" }}
                  >
                    <div style={{ width: 2, height: 16, borderRadius: 1, marginRight: 14, flexShrink: 0, background: "var(--nav-indicator-idle)" }} />
                    <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--nav-label-idle)" }}>
                      {item.name}
                    </span>
                  </button>
                ) : isLink && (item as NavLinkItem).href ? (
                  <Link
                    href={(item as NavLinkItem).href}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className="flex items-center outline-none transition-colors duration-150 hover:bg-white/[0.02] focus-visible:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400/40"
                    style={{ padding: "14px 24px", background: isActive ? "var(--nav-accent-mid)" : undefined }}
                  >
                    <div
                      style={{
                        width: 2, height: 16, borderRadius: 1, marginRight: 14, flexShrink: 0,
                        background: isActive ? "var(--nav-indicator-active)" : "var(--nav-indicator-idle)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em",
                        color: isActive ? "var(--nav-label-active)" : "var(--nav-label-idle)",
                      }}
                    >
                      {item.name}
                    </span>
                  </Link>
                ) : null}

                {i < navigation.length - 1 && (
                  <div style={{ margin: "0 24px", height: 1, background: "var(--on-dark-fill)" }} />
                )}
              </div>
            )
          })}
        </nav>

        {/* Mobile CTAs */}
        <div
          className={cn("mob-ctas shrink-0", visible && "vis")}
          style={{ padding: "16px 20px calc(24px + env(safe-area-inset-bottom, 0px))", borderTop: "1px solid var(--on-dark-fill)" }}
        >
          <Link
            href="/jobs"
            onClick={onClose}
            className="mb-2.5 block rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
          >
            <div
              className="flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
              style={{
                padding: "13px 20px", borderRadius: 10,
                // Was a sky→blue→indigo gradient unrelated to the brand
                // palette; now the same two-stop blue every other primary
                // CTA on the site uses (hero, jobs board, apply forms).
                background: "linear-gradient(90deg, var(--primary) 0%, var(--nav-cta-gradient-end) 100%)",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--primary-foreground)", letterSpacing: "-0.01em" }}>
                Browse Opportunities
              </span>
              <ArrowUpRight style={{ width: 14, height: 14, color: "var(--nav-cta-icon)" }} />
            </div>
          </Link>

          <Link
            href="/#contact"
            onClick={onClose}
            className="block rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <div
              className="flex items-center justify-center gap-2 transition-all duration-200 hover:bg-white/[0.05] active:scale-[0.98]"
              style={{ padding: "11px 20px", borderRadius: 10, border: "1px solid var(--nav-fill-soft)", background: "var(--nav-fill-faint)" }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--nav-cta-secondary-label)" }}>
                Contact Us
              </span>
              <ArrowRight style={{ width: 13, height: 13, color: "var(--nav-cta-secondary-icon)" }} />
            </div>
          </Link>
        </div>
      </div>
    </>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [navReady, setNavReady] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()
  const scrollTo = useAnchorNav()

  const handleEnter = useCallback((name: string) => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current)
    setOpenDropdown(name)
  }, [])

  const handleLeave = useCallback(() => {
    leaveTimeoutRef.current = setTimeout(() => setOpenDropdown(null), 180)
  }, [])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const handleLogoClick = useCallback(
    (e: React.MouseEvent) => {
      if (pathname === "/") {
        e.preventDefault()
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    },
    [pathname],
  )

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y =
            window.scrollY ||
            window.pageYOffset ||
            document.documentElement.scrollTop ||
            document.body.scrollTop ||
            0
          setScrolled((prev) => {
            const next = y > 30
            return prev === next ? prev : next
          })
          ticking = false
        })
        ticking = true
      }
    }

    handleScroll() // Initialize state immediately

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll, { passive: true })
    window.addEventListener("pageshow", handleScroll)

    setNavReady(true)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
      window.removeEventListener("pageshow", handleScroll)
    }
  }, [])

  useEffect(() => {
    setOpenDropdown(null)
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    return () => { if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current) }
  }, [])

  const isTransparent = !scrolled

  return (
    <>
      <header
        className={cn(
          "fixed left-0 right-0 top-0 z-50 transition-all duration-300",
        )}
        style={
          isTransparent
            ? {
              backgroundColor: "transparent",
              borderBottom: "1px solid transparent",
              boxShadow: "none",
            }
            : {
              backgroundColor: "var(--surface-dark)",
              borderBottom: "1px solid var(--nav-line)",
              boxShadow: "var(--nav-scroll-shadow)",
            }
        }
      >
        {/* Bottom accent line — only visible when scrolled */}
        {!isTransparent && (
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
            aria-hidden="true"
            style={{ background: "linear-gradient(90deg, transparent, var(--nav-accent-dim) 50%, transparent)" }}
          />
        )}

        <nav
          aria-label="Main navigation"
          // container-page aligns this navbar perfectly with the hero, content sections, and footer
          // across desktop monitors, laptops, ultra-wide screens, and mobile devices.
          className="container-page relative flex h-[var(--navbar-h)] w-full items-center justify-between"
        >
          {/* ── Logo ── */}
          <Link
            href="/"
            onClick={handleLogoClick}
            className="group flex shrink-0 items-center gap-2.5 sm:gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
            aria-label="N2P Systems — Home"
          >
            <div
              className="relative flex h-[34px] w-[34px] sm:h-[38px] sm:w-[38px] items-center justify-center overflow-hidden rounded-lg sm:rounded-xl border border-white/[0.16] transition-all duration-300 group-hover:border-sky-400/30 group-hover:ring-1 group-hover:ring-sky-400/25"
              style={{ background: "var(--nav-logo-glow)" }}
            >
              <Image
                src="/images/n2p-logo-light.png"
                alt="N2P Systems"
                width={38}
                height={38}
                className="relative h-full w-full object-contain"
                priority
              />
            </div>
            <span className="font-semibold tracking-tight leading-none text-white drop-shadow-sm text-[15px] sm:text-[17px]">
              N2P{" "}
              <span className="font-normal text-white/55">Systems</span>
            </span>
          </Link>

          {/* ── Desktop nav ── */}
          <div className="hidden flex-1 justify-center lg:flex">
            <div className="flex items-center gap-5 xl:gap-7">
              {navigation.map((item) => {
                if ("children" in item && Boolean(item.children)) {
                  return (
                    <DesktopDropdown
                      key={item.name}
                      item={item as NavDropdownItem}
                      isOpen={openDropdown === item.name}
                      onEnter={() => handleEnter(item.name)}
                      onLeave={handleLeave}
                    />
                  )
                }

                if ("anchor" in item && Boolean(item.anchor)) {
                  return (
                    <button
                      key={item.name}
                      onClick={() => scrollTo((item as NavAnchorItem).anchor)}
                      className="group relative rounded-md px-1 py-2 text-[14px] xl:text-[15px] font-medium text-slate-200/80 transition-colors duration-200 outline-none hover:text-white focus-visible:text-white focus-visible:ring-2 focus-visible:ring-sky-400/50"
                    >
                      {item.name}
                    </button>
                  )
                }

                if ("href" in item && Boolean(item.href)) {
                  const linkItem = item as NavLinkItem
                  const isActive = pathname === linkItem.href
                  return (
                    <Link
                      key={linkItem.name}
                      href={linkItem.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative rounded-md px-1 py-2 text-[14px] xl:text-[15px] font-medium transition-colors duration-200 outline-none focus-visible:text-white focus-visible:ring-2 focus-visible:ring-sky-400/50",
                        isActive ? "text-white" : "text-slate-200/80 hover:text-white",
                      )}
                    >
                      {linkItem.name}
                    </Link>
                  )
                }

                return null
              })}
            </div>
          </div>

          {/* ── Desktop right side ── */}
          <div className="flex shrink-0 items-center gap-4">
            {/* Divider */}
            <div
              className="hidden lg:block"
              aria-hidden="true"
              style={{
                width: 1,
                height: 20,
                background: "var(--nav-divider)",
              }}
            />

            <Link
              href="/clients"
              className="hidden items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.05] px-3.5 py-2 text-[12px] xl:text-[13px] font-semibold text-slate-200 transition-all duration-150 hover:border-white/25 hover:bg-white/[0.09] hover:text-white active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-white/30 lg:flex"
            >
              Partner With Us
              <ArrowUpRight style={{ width: 12, height: 12, color: "var(--nav-partner-icon)" }} className="xl:size-[13px]" />
            </Link>

            {/* ── Hamburger (accessible 44px touch target) ── */}
            <button
              className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-xl border border-white/10 bg-white/[0.04] transition-all duration-200 active:scale-95 outline-none hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-sky-400/50 lg:hidden"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-menu"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {/* Top bar */}
              <span
                className="block rounded-full"
                style={{
                  width: 20,
                  height: 1.5,
                  background: mobileOpen ? "var(--nav-accent-strong)" : "var(--nav-hamburger-idle)",
                  transform: mobileOpen ? "translateY(6.5px) rotate(45deg)" : "none",
                  transition: "transform 0.28s ease, background 0.2s ease",
                  transformOrigin: "center",
                  willChange: "transform",
                }}
              />
              {/* Middle bar */}
              <span
                className="block rounded-full"
                style={{
                  width: 14,
                  height: 1.5,
                  background: "var(--nav-hamburger-mid)",
                  opacity: mobileOpen ? 0 : 1,
                  transform: mobileOpen ? "scaleX(0)" : "scaleX(1)",
                  transition: "opacity 0.18s ease, transform 0.18s ease",
                  transformOrigin: "right",
                  willChange: "transform, opacity",
                }}
              />
              {/* Bottom bar — same width as top bar (20px) for symmetric X */}
              <span
                className="block rounded-full"
                style={{
                  width: 20,
                  height: 1.5,
                  background: mobileOpen ? "var(--nav-accent-strong)" : "var(--nav-hamburger-bottom-idle)",
                  transform: mobileOpen ? "translateY(-6.5px) rotate(-45deg)" : "none",
                  transition: "transform 0.28s ease, background 0.2s ease",
                  transformOrigin: "center",
                  willChange: "transform",
                }}
              />
            </button>
          </div>
        </nav>
      </header>

      <MobileMenu isOpen={mobileOpen} onClose={closeMobile} />
    </>
  )
}