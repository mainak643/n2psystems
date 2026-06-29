import Link from "next/link"
import { ArrowLeft, Home, FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Page Not Found | N2P Systems",
  description: "The page you are looking for does not exist or has been moved.",
}

export default function NotFound() {
  return (
    <main className="relative flex min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden bg-[#020617] px-5 py-24 sm:px-6 lg:px-8">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0e1e38_0%,transparent_70%)] opacity-60" />
      <div className="absolute inset-0 texture-dots opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Decorative Icon */}
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-signature-blue/10 ring-1 ring-signature-blue/20">
          <FileQuestion className="size-8 text-primary animate-pulse" />
        </div>

        {/* Text Details */}
        <p className="text-sm font-sans font-bold uppercase tracking-widest text-primary">
          Error 404
        </p>
        <h1 className="mt-3 font-sans text-3xl font-bold tracking-tight text-frost sm:text-4xl">
          Page Not Found
        </h1>
        <p className="mt-4 font-serif text-base text-muted-foreground leading-relaxed">
          The page you are looking for doesn't exist, or has been moved to another address. Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="rounded-lg shadow-lg">
            <Link href="/">
              <Home className="mr-2 size-4" />
              Go Back Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-lg border-border hover:bg-white/5">
            <Link href="/jobs">
              Browse Open Roles
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
