import Link from "next/link"
import { Home, FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Page Not Found | N2P Systems",
  description: "The page you are looking for does not exist or has been moved.",
}

export default function NotFound() {
  return (
    <main className="on-dark relative flex min-h-[calc(100dvh-var(--navbar-h))] items-center justify-center overflow-hidden bg-surface-dark px-5 py-24 sm:px-6 lg:px-8">
      {/* Background gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--surface-dark-glow)_0%,transparent_70%)] opacity-60"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 texture-dots opacity-20" />

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Decorative icon */}
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/25">
          <FileQuestion className="size-8 animate-pulse text-sky-300" aria-hidden="true" />
        </div>

        <p className="eyebrow eyebrow-center justify-center">Error 404</p>
        <h1 className="mt-4 text-heading text-on-dark">Page Not Found</h1>
        <p className="mt-4 text-body text-on-dark-muted">
          The page you are looking for doesn't exist, or has been moved to another address. Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="brand" size="lg">
            <Link href="/">
              <Home className="size-4" aria-hidden="true" />
              Go Back Home
            </Link>
          </Button>
          <Button asChild variant="on-dark" size="lg">
            <Link href="/jobs">Browse Open Roles</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
