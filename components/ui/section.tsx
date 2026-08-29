import { cn } from '@/lib/utils'

const TONE = {
  frost: 'bg-background',
  card: 'bg-card',
  dark: 'bg-surface-dark on-dark',
  brand: 'bg-primary text-primary-foreground',
  none: '',
} as const

const PAD = {
  default: 'section-y',
  compact: 'section-y-sm',
  none: '',
} as const

const WIDTH = {
  default: '',
  narrow: 'container-narrow',
  prose: 'container-prose',
} as const

type ToneKey = keyof typeof TONE
type PadKey = keyof typeof PAD
type WidthKey = keyof typeof WIDTH

export function Container({
  width = 'default',
  className,
  children,
  ...props
}: { width?: WidthKey } & React.ComponentProps<'div'>) {
  return (
    <div className={cn('container-page', WIDTH[width], className)} {...props}>
      {children}
    </div>
  )
}

/**
 * The one page-section wrapper. Replaces 13 divergent vertical-padding
 * recipes and 5 divergent horizontal-gutter recipes across the site with
 * one component driven by three props.
 */
export function Section({
  tone = 'frost',
  pad = 'default',
  width = 'default',
  bare = false,
  className,
  children,
  ...props
}: React.ComponentProps<'section'> & {
  tone?: ToneKey
  pad?: PadKey
  width?: WidthKey
  /** Opt out of the built-in Container — for a full-bleed child that owns its own. */
  bare?: boolean
}) {
  return (
    <section className={cn('relative', TONE[tone], PAD[pad], className)} {...props}>
      {bare ? children : <Container width={width}>{children}</Container>}
    </section>
  )
}
