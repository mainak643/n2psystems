"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Phone/tablet-only apply bar. On a small screen the posting's only Apply
 * buttons are in the hero and at the very bottom of the sidebar, so a
 * candidate reading the requirements had to scroll back up (or all the way
 * down) to act. The bar appears once the hero's own button (`watchId`) has
 * scrolled out of view, and leaves again when it comes back.
 */
export function MobileApplyBar({
  href,
  title,
  meta,
  watchId,
}: {
  href: string
  title: string
  meta?: string
  watchId: string
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const target = document.getElementById(watchId)
    if (!target || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      rootMargin: "0px 0px -10% 0px",
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [watchId])

  return (
    <div
      id="job-apply-bar"
      data-visible={visible}
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-e4 backdrop-blur transition-transform duration-300 lg:hidden",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="container-page flex items-center gap-3 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
        </div>
        <Button asChild variant="brand" size="lg" className="shrink-0">
          <Link href={href} tabIndex={visible ? undefined : -1}>
            Apply
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
