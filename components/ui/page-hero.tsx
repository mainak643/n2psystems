import Link from 'next/link'
import { ArrowLeft, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Container } from '@/components/ui/section'

export type PageHeroProps = {
  eyebrow?: string
  eyebrowIcon?: LucideIcon
  /** Small pill above the eyebrow — hero badges seen on clients/hiring/jobs/resume. */
  badge?: React.ReactNode
  title: React.ReactNode
  titleId?: string
  description?: React.ReactNode
  /** "Back to …" link above the title (job detail, apply, legal pages). */
  backLink?: { href: string; label: string }
  /** Chip / metadata row under the title (job detail, apply). */
  meta?: React.ReactNode
  /** CTA row — pass <Button variant="brand" size="xl" asChild>. */
  actions?: React.ReactNode
  align?: 'center' | 'start'
  pad?: 'default' | 'compact'
  width?: 'default' | 'narrow'
  className?: string
  /** Extra decorative layers rendered behind the content (e.g. resume's aurora gradients). */
  children?: React.ReactNode
}

/**
 * The dark hero band every non-home page opens with. One component
 * standing in for what used to be seven divergent hand-rolled headers —
 * driven entirely by props so a new page cannot introduce an eighth.
 */
export function PageHero({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  badge,
  title,
  titleId,
  description,
  backLink,
  meta,
  actions,
  align = 'center',
  pad = 'default',
  width = 'default',
  className,
  children,
}: PageHeroProps) {
  const centered = align === 'center'

  return (
    <section
      className={cn('page-hero on-dark texture-dots relative overflow-hidden', pad === 'compact' && 'page-hero--compact', className)}
    >
      {/* ── Ambient Aurora Lighting (Cyan / Green / Navy) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(34,167,240,0.22),transparent_38%),radial-gradient(circle_at_82%_0%,rgba(122,201,67,0.16),transparent_35%)]"
      />
      <div className="page-hero__glow" aria-hidden="true" />
      {children}
      <Container width={width} className="relative z-10">
        <div className={cn(centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl')}>
          {backLink && (
            <Link
              href={backLink.href}
              className="mb-6 inline-flex items-center gap-2 text-caption font-medium text-on-dark-muted transition-colors hover:text-on-dark"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {backLink.label}
            </Link>
          )}

          {badge && <div className={cn('mb-5 flex empty:hidden', centered && 'justify-center')}>{badge}</div>}

          {eyebrow && (
            <p className={cn('eyebrow mb-4', centered && 'eyebrow-center justify-center')}>
              {EyebrowIcon && <EyebrowIcon className="size-3.5" aria-hidden="true" />}
              {eyebrow}
            </p>
          )}

          <h1 id={titleId} className="text-heading text-balance text-on-dark font-bold tracking-tight">
            {title}
          </h1>

          {description && (
            <p className={cn('measure mt-5 text-lead text-on-dark-muted', centered && 'mx-auto')}>
              {description}
            </p>
          )}

          {/* Glowing gradient accent bar */}
          <div className={cn("mt-6 h-1 w-12 rounded-full bg-gradient-to-r from-tech-green to-cyan-support", centered ? "mx-auto" : "")} />

          {meta && <div className="mt-4">{meta}</div>}

          {actions && (
            <div className={cn('mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4', centered && 'sm:justify-center')}>
              {actions}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
